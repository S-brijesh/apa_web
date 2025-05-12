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
          const x = parseInt(match[1], 10);
          const y = parseInt(match[2], 10);
          const timestamp = parseInt(match[3], 10);
          
          console.log(`Adding point: x=${x}, y=${y}, timestamp=${timestamp}`);
          
          setPlotData(prev => {
            const newData = [...prev, { x, y, timestamp, time: new Date().toLocaleTimeString() }];
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

  // Calculate visible domain for y-axis
  const yDomain = useMemo(() => {
    if (plotData.length === 0) return [0, 200]; // Default
    
    let min = Math.min(...plotData.map(d => d.y));
    let max = Math.max(...plotData.map(d => d.y));
    
    // Add some padding
    const padding = Math.max(20, (max - min) * 0.1);
    min = Math.max(0, min - padding);
    max = max + padding;
    
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

      {/* ECG Plot */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-700">Real-time ECG Plot</h3>
          <div className="flex gap-4">
            <button 
              onClick={clearPlotData}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Clear Plot
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
        </div>
        
        <div className="h-64 w-full bg-gray-50 border border-gray-200 rounded">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={plotData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                name="Time" 
                label={{ value: 'Time', position: 'insideBottomRight', offset: 0 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={yDomain}
                label={{ value: 'Value', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name) => [value, name === 'y' ? 'Y Value' : 'X Value']}
                labelFormatter={(label) => `Timestamp: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="Value"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
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