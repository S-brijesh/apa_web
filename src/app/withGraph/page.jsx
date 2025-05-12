"use client";
import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { useToggle } from 'react-use';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const [showGraph, setShowGraph] = useState(true);

  // Parse data in the format $x&y#timestamp
  const parseData = (rawData) => {
    try {
      if (typeof rawData !== 'string') return null;
      
      const match = rawData.match(/\$(\d+)&(\d+)#(\d+)/);
      if (!match) return null;
      
      return {
        x: parseInt(match[1], 10),
        y: parseInt(match[2], 10),
        timestamp: parseInt(match[3], 10)
      };
    } catch (error) {
      console.error('Error parsing data:', error);
      return null;
    }
  };

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
        
        // Parse and add data to plot if it's in the expected format
        const rawData = data.data?.toString() || '';
        const parsedPoint = parseData(rawData);
        
        if (parsedPoint) {
          setPlotData(prev => {
            const newData = [...prev, {
              x: parsedPoint.x,
              y: parsedPoint.y,
              time: new Date(parsedPoint.timestamp).toLocaleTimeString()
            }];
            
            // Keep only the last 50 data points for performance
            if (newData.length > 50) {
              return newData.slice(-50);
            }
            return newData;
          });
        }
      }
    });

    return () => newSocket.close();
  }, [isPaused]);

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
                {port.description || port.device}
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

      {/* Data Visualization Section */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold text-gray-700">Data Visualization</h3>
          <div className="flex gap-2">
            <button 
              onClick={clearPlotData}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Clear Graph
            </button>
            <button 
              onClick={() => setShowGraph(!showGraph)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {showGraph ? 'Hide Graph' : 'Show Graph'}
            </button>
          </div>
        </div>
        
        {showGraph && (
          <div className="h-64 bg-gray-50 border border-gray-200 rounded">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={plotData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="x" 
                  label={{ value: 'X Value', position: 'insideBottom', offset: -5 }} 
                />
                <YAxis 
                  label={{ value: 'Y Value', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'y' ? 'Y Value' : 'X Value']}
                  labelFormatter={(x) => `Time: ${plotData.find(d => d.x === x)?.time || ''}`}
                />
                <Legend />
                <Line type="monotone" dataKey="y" stroke="#8884d8" dot={{ r: 3 }} activeDot={{ r: 5 }} name="Y Value" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
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
            className="px-4 py-2 border rounded flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
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