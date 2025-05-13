"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import io from 'socket.io-client';
import { useToggle } from 'react-use';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SerialMonitor = () => {
  const [socket, setSocket] = useState(null);
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [baudRate, setBaudRate] = useState(115200);
  const [status, setStatus] = useState('disconnected');
  const [currentData, setCurrentData] = useState('No data received yet');
  const [history, setHistory] = useState([]);
  const [isPaused, togglePaused] = useToggle(false);
  const [command, setCommand] = useState('');
  const [plotData, setPlotData] = useState([]);
  const [maxDataPoints, setMaxDataPoints] = useState(100);
  const [displayMode, setDisplayMode] = useState('ecg'); // 'ecg', 'xy', or 'time'

  // Function to toggle between different view modes
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(current => {
      switch(current) {
        case 'ecg': return 'xy';
        case 'xy': return 'time';
        case 'time': return 'ecg';
        default: return 'ecg';
      }
    });
  }, []);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      withCredentials: true,
      extraHeaders: {
        "my-custom-header": "abcd"
      }
    });
    
    setSocket(newSocket);
    
    newSocket.on('connect_error', (err) => {
      console.error('Connection Error:', err);
      alert(`Connection error: ${err.message}`);
    });
    
    newSocket.on('connect_timeout', () => {
      console.error('Connection Timeout');
      alert('Connection timeout');
    });
    
    newSocket.on('connection_status', (data) => {
      setStatus(data.connected ? 'connected' : 'disconnected');
    });

    newSocket.on('arduino_data', (data) => {
      if (!isPaused) {
        const timestamp = new Date(data.timestamp * 1000).toLocaleTimeString();
        const formattedData = JSON.stringify(data, null, 2);
        
        setCurrentData(formattedData);
        setHistory(prev => [
          `[${timestamp}] ${formattedData}`,
          ...prev.slice(0, 99)
        ]);
        
        // Enhanced debugging and parsing for the data format
        console.log("Received data:", data);
        
        // Try to parse the data in multiple ways
        let dataStr = '';
        let match = null;
        
        // If data is an object with a data property
        if (data && typeof data.data === 'string') {
          dataStr = data.data.trim();
          match = dataStr.match(/\$(\d+)&(\d+)#(\d+)/);
          console.log("Parsing from data.data:", dataStr);
        } 
        // If data is directly a string
        else if (typeof data === 'string') {
          dataStr = data.trim();
          match = dataStr.match(/\$(\d+)&(\d+)#(\d+)/);
          console.log("Parsing from direct string:", dataStr);
        }
        // Try to parse from the raw JSON string as a last resort
        else {
          try {
            dataStr = formattedData;
            match = dataStr.match(/\$(\d+)&(\d+)#(\d+)/);
            console.log("Trying to parse from formatted JSON:", dataStr);
          } catch (e) {
            console.error("Parse error:", e);
          }
        }
        
        if (match) {
          console.log("Match found:", match);
          const x = parseInt(match[1], 10);     // $ value
          const y = parseInt(match[2], 10);     // & value
          const timestamp = parseInt(match[3], 10); // # value (timestamp)
          
          console.log(`Adding point: x=${x}, y=${y}, timestamp=${timestamp}`);
          
          setPlotData(prev => {
            const newData = [...prev, { 
              dollarValue: x,       // $ value
              ampValue: y,          // & value
              timestamp,            // # value
              time: new Date().toLocaleTimeString() 
            }];
            console.log("New plot data:", newData);
            // Keep only the last maxDataPoints for smooth rendering
            return newData.slice(-maxDataPoints);
          });
        } else {
          console.warn("No match found in:", dataStr);
        }
      }
    });

    return () => newSocket.close();
  }, [isPaused, maxDataPoints]);

  const refreshPorts = useCallback(async () => {
    if (socket) {
      socket.emit('list_ports', {}, (response) => {
        if (response && response.ports) {
          setPorts(response.ports);
        } else {
          console.error('Invalid ports response:', response);
          alert('Failed to fetch ports');
        }
      });
    }
  }, [socket]);

  const connect = useCallback(() => {
    socket.emit('connect_to_arduino', {
      port: selectedPort,
      baud_rate: baudRate
    }, (response) => {
      if (!response.success) alert(response.message);
    });
  }, [socket, selectedPort, baudRate]);

  const disconnect = useCallback(() => {
    socket.emit('disconnect_from_arduino', {}, (response) => {
      if (!response.success) alert(response.message);
    });
  }, [socket]);

  const sendCommand = useCallback(() => {
    if (command.trim()) {
      socket.emit('send_command', { command: command.trim() + '\n' });
      setCommand('');
    }
  }, [command, socket]);

  const clearPlotData = useCallback(() => {
    setPlotData([]);
  }, []);

  // Add test data function for debugging
  const addTestData = useCallback(() => {
    const now = Date.now();
    // Add 10 test points with smaller variations to demonstrate the adaptive scaling
    // First get current min/max if data exists
    let baseDollar = 100;
    let baseAmp = 100;
    let baseTimestamp = now;
    let variation = 10; // Small variation by default

    if (plotData.length > 0) {
      // Use the last point as reference
      const lastPoint = plotData[plotData.length - 1];
      baseDollar = lastPoint.dollarValue;
      baseAmp = lastPoint.ampValue;
      baseTimestamp = lastPoint.timestamp || now;
      
      // Decide on variation - make it small to demonstrate adaptive scaling
      variation = Math.max(3, Math.min(10, (baseAmp * 0.05)));
    }

    // Add test points
    for (let i = 0; i < 10; i++) {
      const dollarValue = baseDollar + Math.floor((Math.random() * variation * 2) - variation);
      const ampValue = baseAmp + Math.floor((Math.random() * variation * 2) - variation);
      const timestamp = baseTimestamp + i * 10; // Incrementing timestamp
      
      setPlotData(prev => {
        const newData = [...prev, { 
          dollarValue, 
          ampValue, 
          timestamp,
          time: new Date().toLocaleTimeString() 
        }];
        return newData.slice(-maxDataPoints);
      });
    }
  }, [maxDataPoints, plotData]);

  // Calculate visible domain for dollar and amp values with improved auto-scaling
  const dollarDomain = useMemo(() => {
    if (plotData.length === 0) return [0, 200]; // Default
    
    const values = plotData.map(d => d.dollarValue);
    let min = Math.min(...values);
    let max = Math.max(...values);
    
    // If the range is very small, create a minimum range
    if (max - min < 20) {
      const midPoint = (max + min) / 2;
      min = midPoint - 10;
      max = midPoint + 10;
    } else {
      // Add some padding (smaller percentage for larger ranges)
      const range = max - min;
      const paddingPercent = range > 100 ? 0.05 : range > 50 ? 0.1 : 0.15;
      const padding = Math.max(5, range * paddingPercent);
      min = Math.max(0, min - padding);
      max = max + padding;
    }
    
    console.log(`$ value range: ${min} to ${max} (range: ${max-min})`);
    return [min, max];
  }, [plotData]);

  const ampDomain = useMemo(() => {
    if (plotData.length === 0) return [0, 200]; // Default
    
    const values = plotData.map(d => d.ampValue);
    let min = Math.min(...values);
    let max = Math.max(...values);
    
    // If the range is very small, create a minimum range
    if (max - min < 20) {
      const midPoint = (max + min) / 2;
      min = midPoint - 10;
      max = midPoint + 10;
    } else {
      // Add some padding (smaller percentage for larger ranges)
      const range = max - min;
      const paddingPercent = range > 100 ? 0.05 : range > 50 ? 0.1 : 0.15;
      const padding = Math.max(5, range * paddingPercent);
      min = Math.max(0, min - padding);
      max = max + padding;
    }
    
    console.log(`& value range: ${min} to ${max} (range: ${max-min})`);
    return [min, max];
  }, [plotData]);

  const timestampDomain = useMemo(() => {
    if (plotData.length === 0) return [0, 1000]; // Default
    
    const values = plotData.map(d => d.timestamp);
    let min = Math.min(...values);
    let max = Math.max(...values);
    
    // Add some padding
    const range = max - min;
    const padding = Math.max(1, range * 0.05);
    min = Math.max(0, min - padding);
    max = max + padding;
    
    console.log(`Timestamp range: ${min} to ${max} (range: ${max-min})`);
    return [min, max];
  }, [plotData]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Arduino Data Monitor</h1>
      
      <div className="flex flex-wrap gap-4 bg-gray-100 p-4 rounded-lg mb-4">
        <div className="flex items-center text-black gap-4">
          <select 
            className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedPort} 
            onChange={(e) => setSelectedPort(e.target.value)}
          >
            <option value="">-- Select Port --</option>
            {ports.map(port => (
              <option key={port.device} value={port.device}>
                {port.description}
              </option>
            ))}
          </select>
          <button 
            onClick={refreshPorts}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Refresh Ports
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-gray-700">Baud Rate:</label>
          <input
            type="number"
            className="px-4 py-2 text-black border rounded w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
          />
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={connect} 
            disabled={status === 'connected'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Connect
          </button>
          <button 
            onClick={disconnect} 
            disabled={status !== 'connected'}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Disconnect
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-700">Status:</span>
          <span className={`px-3 py-1 rounded ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Common controls for both graphs */}
      <div className="flex justify-end gap-4 mb-4">
        <button 
          onClick={clearPlotData}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Clear Plots
        </button>
        <button 
          onClick={addTestData}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Add Test Data
        </button>
        <button 
          onClick={toggleDisplayMode}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Mode: {displayMode.toUpperCase()}
        </button>
        <div className="flex items-center">
          <label className="text-gray-700 mr-2">Max Points:</label>
          <select 
            value={maxDataPoints}
            onChange={(e) => setMaxDataPoints(Number(e.target.value))}
            className="px-2 py-1 border rounded text-black"
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="500">500</option>
          </select>
        </div>
      </div>

      {/* First Graph - $ value vs Timestamp */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-700">
            $ Value vs Timestamp Plot
          </h3>
        </div>
        
        <div className="h-64 w-full bg-gray-50 border border-gray-200 rounded">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={plotData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                type="number"
                name="Timestamp" 
                domain={timestampDomain}
                label={{ value: 'Timestamp (#)', position: 'insideBottomRight', offset: 0 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                dataKey="dollarValue"
                domain={dollarDomain}
                label={{ value: '$ Value', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
                allowDataOverflow={false}
              />
              <Tooltip 
                formatter={(value, name) => [value, name === 'dollarValue' ? '$ Value' : 'Timestamp']}
                labelFormatter={(label) => `Timestamp: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="dollarValue" 
                stroke="#ff0000" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="$ Value"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Graph - & value vs Timestamp */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-700">
            & Value vs Timestamp Plot
          </h3>
        </div>
        
        <div className="h-64 w-full bg-gray-50 border border-gray-200 rounded">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={plotData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                type="number"
                name="Timestamp" 
                domain={timestampDomain}
                label={{ value: 'Timestamp (#)', position: 'insideBottomRight', offset: 0 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                dataKey="ampValue"
                domain={ampDomain}
                label={{ value: '& Value', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
                allowDataOverflow={false}
              />
              <Tooltip 
                formatter={(value, name) => [value, name === 'ampValue' ? '& Value' : 'Timestamp']}
                labelFormatter={(label) => `Timestamp: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="ampValue" 
                stroke="#0000ff" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="& Value"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Debug: Show Raw Plot Data */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
        <details>
          <summary className="text-blue-600 cursor-pointer">Debug Plot Data ({plotData.length} points)</summary>
          <pre className="mt-2 p-2 bg-gray-100 text-xs text-black overflow-auto max-h-40 rounded">
            {JSON.stringify(plotData, null, 2)}
          </pre>
        </details>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Current Data</h3>
        <pre className="bg-gray-50 text-black p-4 rounded font-mono text-sm border-2 border-blue-300">
          {currentData}
        </pre>
      </div>

      <div className="flex flex-wrap gap-4 bg-gray-100 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setHistory([])}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Clear History
          </button>
          <button 
            onClick={togglePaused}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>

        <div className="flex items-center gap-4 flex-grow">
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command"
            className="px-4 py-2 border rounded flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <button 
            onClick={sendCommand}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Historical Data</h3>
        <pre className="bg-gray-50 text-black p-4 rounded font-mono text-sm h-96 overflow-y-auto whitespace-pre-wrap">
          {history.join('\n')}
        </pre>
      </div>
    </div>
  );
};

export default SerialMonitor;