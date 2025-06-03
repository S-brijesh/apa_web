'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

export default function ArduinoPage() {
  const [port, setPort] = useState(null);
  const [reader, setReader] = useState(null);
  const [writer, setWriter] = useState(null);
  const [data, setData] = useState('');
  const [plotData, setPlotData] = useState([]);
  const [isReading, setIsReading] = useState(false);
  const [dataRate, setDataRate] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [yAxisRange1, setYAxisRange1] = useState({ min: 0, max: 100 });
  const [yAxisRange2, setYAxisRange2] = useState({ min: 0, max: 100 });
  const [autoZoom, setAutoZoom] = useState(true);

  // Use refs for performance-critical data to avoid re-renders
  const plotDataRef = useRef([]);
  const dataBufferRef = useRef('');
  const lastRateUpdateRef = useRef(Date.now());
  const dataCountRef = useRef(0);
  const lastScaleUpdateRef = useRef(Date.now());
  const readLoopRef = useRef(null);

  // Calculate dynamic Y-axis range for better visualization
  const calculateYAxisRange = useCallback((data, valueKey) => {
    if (data.length === 0) return { min: 0, max: 100 };

    // Get recent data points (last 50 for responsive scaling)
    const recentData = data.slice(-50);
    const values = recentData.map(d => d[valueKey]).filter(v => v !== undefined);
    
    if (values.length === 0) return { min: 0, max: 100 };

    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // For pulse/vein data, we want to show the full amplitude clearly
    const range = max - min;
    const padding = Math.max(range * 0.1, 5); // 10% padding or minimum 5 units
    
    // For pulse data, ensure we show meaningful range even for small variations
    const effectiveMin = Math.max(0, min - padding);
    const effectiveMax = max + padding;
    
    // Minimum range to avoid too zoomed in view
    const minRange = 20;
    if (effectiveMax - effectiveMin < minRange) {
      const center = (effectiveMax + effectiveMin) / 2;
      return {
        min: Math.max(0, center - minRange / 2),
        max: center + minRange / 2
      };
    }
    
    return {
      min: effectiveMin,
      max: effectiveMax
    };
  }, []);

  // Optimized data parsing with minimal string operations
  const parseIncomingData = useCallback((chunk) => {
    dataBufferRef.current += chunk;
    const lines = dataBufferRef.current.split('\n');
    
    // Keep the last incomplete line in buffer
    dataBufferRef.current = lines.pop() || '';
    
    const newDataPoints = [];
    const currentTime = Date.now();
    
    for (const line of lines) {
      if (line.includes('$') && line.includes('&')) {
        const clean = line.trim();
        
        // Update display data (throttled to prevent UI lag)
        if (currentTime - lastUpdateTime > 100) { // Update display every 100ms max
          setData(prev => (prev + '\n' + clean).slice(-2000)); // Keep last 2000 chars
          setLastUpdateTime(currentTime);
        }

        // Fast regex parsing
        const match = clean.match(/\$(\d+)&(\d+)#(\d+)/);
        if (match) {
          const timestamp = parseInt(match[3], 10);
          const value1 = parseInt(match[1], 10);
          const value2 = parseInt(match[2], 10);
          
          newDataPoints.push({
            timestamp,
            value1,
            value2,
          });
          
          dataCountRef.current++;
        }
      }
    }

    // Batch update plot data for better performance
    if (newDataPoints.length > 0) {
      plotDataRef.current = [...plotDataRef.current, ...newDataPoints].slice(-100); // Keep last 100 points
      setPlotData([...plotDataRef.current]); // Trigger re-render with new array reference
      
      // Update Y-axis scaling in real-time (throttled)
      if (autoZoom && currentTime - lastScaleUpdateRef.current > 500) { // Update scale every 500ms
        const range1 = calculateYAxisRange(plotDataRef.current, 'value1');
        const range2 = calculateYAxisRange(plotDataRef.current, 'value2');
        
        setYAxisRange1(range1);
        setYAxisRange2(range2);
        lastScaleUpdateRef.current = currentTime;
      }
    }

    // Update data rate calculation
    if (currentTime - lastRateUpdateRef.current > 1000) {
      setDataRate(dataCountRef.current);
      dataCountRef.current = 0;
      lastRateUpdateRef.current = currentTime;
    }
  }, [lastUpdateTime, autoZoom, calculateYAxisRange]);

  // Optimized port reading with proper error handling
  const listenToPort = useCallback(async (reader) => {
    const readLoop = async () => {
      try {
        while (isReading && reader) {
          const { value, done } = await reader.read();
          if (done) break;
          
          if (value) {
            parseIncomingData(value);
          }
        }
      } catch (err) {
        console.log('Read loop stopped:', err.message);
        // Don't throw error, just exit gracefully
      }
    };

    readLoopRef.current = readLoop();
    return readLoopRef.current;
  }, [parseIncomingData, isReading]);

  const connectToPort = async () => {
    try {
      console.log('Requesting serial port...');
      const selectedPort = await navigator.serial.requestPort();
      
      console.log('Opening port...');
      // Optimized serial settings for real-time performance
      await selectedPort.open({ 
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      console.log('Setting up streams...');
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = selectedPort.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(selectedPort.writable);
      const writer = textEncoder.writable.getWriter();

      setPort(selectedPort);
      setReader(reader);
      setWriter(writer);
      setIsReading(true);

      // Reset counters
      plotDataRef.current = [];
      dataBufferRef.current = '';
      dataCountRef.current = 0;
      lastRateUpdateRef.current = Date.now();

      console.log('Connection established successfully');
    } catch (error) {
      console.error('Connection failed:', error);
      // Reset state on connection failure
      setPort(null);
      setReader(null);
      setWriter(null);
      setIsReading(false);
      
      // Show user-friendly error message
      if (error.name === 'InvalidStateError') {
        alert('Port is already in use. Please wait a moment and try again, or unplug and reconnect your Arduino.');
      }
    }
  };

  // Auto-start reading when connection is established
  useEffect(() => {
    if (reader && isReading) {
      listenToPort(reader);
    }
  }, [reader, isReading, listenToPort]);

  const requestData = async () => {
    if (writer) {
      try {
        await writer.write('$');
      } catch (error) {
        console.error('Error sending data request:', error);
      }
    }
  };

  const stopCommunication = async () => {
    console.log('Starting disconnect process...');
    
    // Step 1: Stop the reading loop first
    setIsReading(false);
    
    // Wait for any pending reads to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Step 2: Send stop command if writer is available
      if (writer) {
        try {
          await writer.write('D');
          console.log('Stop command sent');
        } catch (e) {
          console.log('Error sending stop command:', e.message);
        }
      }
      
      // Step 3: Release writer lock and close
      if (writer) {
        try {
          await writer.close();
          console.log('Writer closed');
        } catch (e) {
          console.log('Writer close error:', e.message);
        }
      }
      
      // Step 4: Cancel and release reader
      if (reader) {
        try {
          await reader.cancel();
          console.log('Reader cancelled');
        } catch (e) {
          console.log('Reader cancel error:', e.message);
        }
      }
      
      // Step 5: Wait for streams to fully close
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Step 6: Close the port
      if (port) {
        try {
          await port.close();
          console.log('Port closed successfully');
        } catch (e) {
          console.log('Port close error:', e.message);
        }
      }
      
    } catch (error) {
      console.error('Error during disconnect:', error);
    } finally {
      // Step 7: Reset all state regardless of errors
      setReader(null);
      setWriter(null);
      setPort(null);
      setIsReading(false);
      readLoopRef.current = null;
      console.log('Disconnect completed - all states reset');
    }
  };

  const clearData = () => {
    setData('');
    setPlotData([]);
    plotDataRef.current = [];
    dataBufferRef.current = '';
    dataCountRef.current = 0;
    // Reset zoom ranges
    setYAxisRange1({ min: 0, max: 100 });
    setYAxisRange2({ min: 0, max: 100 });
  };

  const resetZoom = () => {
    if (plotDataRef.current.length > 0) {
      const range1 = calculateYAxisRange(plotDataRef.current, 'value1');
      const range2 = calculateYAxisRange(plotDataRef.current, 'value2');
      setYAxisRange1(range1);
      setYAxisRange2(range2);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Real-Time Arduino Data Dashboard</h1>
          
          <div className="flex items-center gap-4 mb-4">
            {!port ? (
              <button 
                onClick={connectToPort} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Connect to Arduino
              </button>
            ) : (
              <div className="flex gap-4">
                <button 
                  onClick={requestData} 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Request Data ($)
                </button>
                <button 
                  onClick={stopCommunication} 
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
                <button 
                  onClick={clearData} 
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Clear Data
                </button>
                <button 
                  onClick={resetZoom} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Reset Zoom
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoZoom}
                onChange={(e) => setAutoZoom(e.target.checked)}
                className="rounded"
              />
              <span>Auto-Zoom (Dynamic Y-axis scaling)</span>
            </label>
          </div>

          <div className="flex gap-6 text-sm text-gray-600 mt-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isReading ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Status: {isReading ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div>Data Rate: {dataRate} msg/sec</div>
            <div>Plot Points: {plotData.length}</div>
            <div>Y1 Range: {yAxisRange1.min.toFixed(0)} - {yAxisRange1.max.toFixed(0)}</div>
            <div>Y2 Range: {yAxisRange2.min.toFixed(0)} - {yAxisRange2.max.toFixed(0)}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Value 1 ($ Value) - Real-Time Pulse Chart</h2>
          <div className="overflow-x-auto">
            <LineChart width={800} height={350} data={plotData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#666"
                tick={{ fontSize: 12 }}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                stroke="#666"
                tick={{ fontSize: 12 }}
                domain={autoZoom ? [yAxisRange1.min, yAxisRange1.max] : ['dataMin', 'dataMax']}
                tickFormatter={(value) => value.toFixed(0)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #dee2e6',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => [value.toFixed(0), name]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value1" 
                stroke="#3b82f6" 
                name="$ Value (Pulse)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Current Range: {yAxisRange1.min.toFixed(0)} to {yAxisRange1.max.toFixed(0)} 
            {plotData.length > 0 && (
              <span className="ml-4">
                Current Value: <span className="font-bold text-blue-600">{plotData[plotData.length - 1]?.value1 || 0}</span>
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Value 2 (& Value) - Real-Time Pulse Chart</h2>
          <div className="overflow-x-auto">
            <LineChart width={800} height={350} data={plotData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#666"
                tick={{ fontSize: 12 }}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                stroke="#666"
                tick={{ fontSize: 12 }}
                domain={autoZoom ? [yAxisRange2.min, yAxisRange2.max] : ['dataMin', 'dataMax']}
                tickFormatter={(value) => value.toFixed(0)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #dee2e6',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => [value.toFixed(0), name]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value2" 
                stroke="#10b981" 
                name="& Value (Pulse)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Current Range: {yAxisRange2.min.toFixed(0)} to {yAxisRange2.max.toFixed(0)}
            {plotData.length > 0 && (
              <span className="ml-4">
                Current Value: <span className="font-bold text-green-600">{plotData[plotData.length - 1]?.value2 || 0}</span>
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Raw Data Stream</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-64 overflow-auto whitespace-pre-wrap">
              {data || 'No data received yet...'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Real-Time Statistics</h2>
            <div className="space-y-3">
              {plotData.length > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Latest Value 1:</span>
                    <span className="font-mono font-bold text-blue-600">
                      {plotData[plotData.length - 1]?.value1 || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latest Value 2:</span>
                    <span className="font-mono font-bold text-green-600">
                      {plotData[plotData.length - 1]?.value2 || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latest Timestamp:</span>
                    <span className="font-mono">
                      {plotData[plotData.length - 1]?.timestamp || 0}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
}