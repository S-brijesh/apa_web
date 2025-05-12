"use client";
import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { useToggle } from 'react-use';

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

  useEffect(() => {
    // const newSocket = io('http://localhost:5000');
    const newSocket = io('http://localhost:5000', {
        transports: ['websocket'], // Force WebSocket transport
        withCredentials: true,
        extraHeaders: {
          "my-custom-header": "abcd"
        }
      });
    setSocket(newSocket);
      // Add error handlers
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
      }
    });

    return () => newSocket.close();
  }, [isPaused]);

//   const refreshPorts = useCallback(async () => {
//     if (socket) {
//       socket.emit('list_ports', {}, (response) => {
//         setPorts(response.ports);
//       });
//     }
//   }, [socket]);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold  text-white mb-8 text-center">Arduino Data Monitor</h1>
      
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