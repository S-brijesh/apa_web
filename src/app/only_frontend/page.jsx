// pages/serial.js
"use client";
import { useState, useEffect, useRef } from 'react';

export default function SerialPage() {
  const [availablePorts, setAvailablePorts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [receivedData, setReceivedData] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [isReading, setIsReading] = useState(false);

  const portRef = useRef(null);
  const readerRef = useRef(null);
  const writerRef = useRef(null);
  const keepReadingRef = useRef(false);

  useEffect(() => {
    // Check if Web Serial API is supported
    if (!('serial' in navigator)) {
      setConnectionStatus('Web Serial API not supported');
    }

    // Cleanup on unmount
    return () => {
      disconnectPort();
    };
  }, []);

  // Get already granted ports
  const getGrantedPorts = async () => {
    try {
      if ('serial' in navigator) {
        const ports = await navigator.serial.getPorts();
        const portList = ports.map((port, index) => {
          const info = port.getInfo();
          return {
            id: index,
            port: port,
            name: `Port ${index + 1} (VID: ${info.usbVendorId || 'Unknown'}, PID: ${info.usbProductId || 'Unknown'})`,
            vendorId: info.usbVendorId,
            productId: info.usbProductId
          };
        });
        setAvailablePorts(portList);
      }
    } catch (error) {
      console.error('Error getting granted ports:', error);
    }
  };

  // Request access to a new port
  const requestNewPort = async () => {
    try {
      if ('serial' in navigator) {
        const port = await navigator.serial.requestPort();
        await getGrantedPorts(); // Refresh the list
      }
    } catch (error) {
      console.error('Error requesting port:', error);
      if (error.name !== 'NotFoundError') {
        alert('Error requesting port: ' + error.message);
      }
    }
  };

  // Connect to a specific port
  const connectToPort = async (portData) => {
    try {
      setConnectionStatus('Connecting...');
      const port = portData.port;

      // Open the port
      await port.open({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      portRef.current = port;
      setIsConnected(true);
      setConnectionStatus('Connected');

      // Get writer to send commands
      writerRef.current = port.writable.getWriter();

      // Send '$' to start data transmission
      const encoder = new TextEncoder();
      await writerRef.current.write(encoder.encode('$'));
      console.log('Start command ($) sent');

      // Start reading data
      startReading(port);

    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('Connection Failed');
      alert('Connection failed: ' + error.message);
    }
  };

  // Start reading data from the port
  const startReading = async (port) => {
    try {
      setIsReading(true);
      keepReadingRef.current = true;
      
      const reader = port.readable.getReader();
      readerRef.current = reader;
      
      const decoder = new TextDecoder();
      let buffer = '';

      while (keepReadingRef.current && port.readable) {
        try {
          const { value, done } = await reader.read();
          
          if (done) {
            console.log('Reader done');
            break;
          }

          if (value) {
            // Decode the received bytes
            const text = decoder.decode(value, { stream: true });
            buffer += text;

            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            lines.forEach(line => {
              const cleanLine = line.trim();
              if (cleanLine) {
                const timestamp = new Date().toLocaleTimeString();
                setReceivedData(prev => [...prev, {
                  id: Date.now() + Math.random(),
                  timestamp: timestamp,
                  data: cleanLine
                }]);
              }
            });
          }
        } catch (readError) {
          if (readError.name === 'NetworkError' || readError.name === 'NotReadableError') {
            console.log('Reading stopped:', readError.message);
            break;
          }
          throw readError;
        }
      }
    } catch (error) {
      console.error('Reading error:', error);
      setConnectionStatus('Reading Error');
    } finally {
      setIsReading(false);
      if (readerRef.current) {
        try {
          await readerRef.current.releaseLock();
        } catch (e) {
          console.log('Reader already released');
        }
        readerRef.current = null;
      }
    }
  };

  // Disconnect from the port
  const disconnectPort = async () => {
    try {
      setConnectionStatus('Disconnecting...');
      keepReadingRef.current = false;

      // Send 'D' command to stop data transmission
      if (writerRef.current && portRef.current) {
        try {
          const encoder = new TextEncoder();
          await writerRef.current.write(encoder.encode('D'));
          console.log('Stop command (D) sent');
          
          // Wait a bit for the command to be processed
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (writeError) {
          console.error('Error sending stop command:', writeError);
        }
      }

      // Release writer
      if (writerRef.current) {
        try {
          await writerRef.current.releaseLock();
        } catch (e) {
          console.log('Writer already released');
        }
        writerRef.current = null;
      }

      // Cancel reader
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch (e) {
          console.log('Reader cancel error:', e);
        }
      }

      // Close port
      if (portRef.current) {
        try {
          await portRef.current.close();
        } catch (e) {
          console.log('Port close error:', e);
        }
        portRef.current = null;
      }

      setIsConnected(false);
      setConnectionStatus('Disconnected');
      
    } catch (error) {
      console.error('Disconnection error:', error);
      setConnectionStatus('Disconnect Error');
    }
  };

  // Clear received data
  const clearData = () => {
    setReceivedData([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Serial Port Communication
          </h1>

          {/* Status Bar */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className={`px-4 py-2 rounded-full text-white font-semibold ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {connectionStatus}
              </div>
              {isReading && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  Reading data...
                </div>
              )}
            </div>
          </div>

          {/* Port Controls */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Available Ports */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Available Ports</h2>
              
              <div className="space-y-3 mb-4">
                <button
                  onClick={getGrantedPorts}
                  disabled={isConnected}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Refresh Ports
                </button>
                
                <button
                  onClick={requestNewPort}
                  disabled={isConnected}
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add New Port
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {!('serial' in navigator) ? (
                  <p className="text-red-500 text-sm p-3 bg-red-50 rounded">
                    Web Serial API not supported in this browser. 
                    Please use Chrome, Edge, or Opera.
                  </p>
                ) : availablePorts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No ports available. Click "Add New Port" to select a device.
                  </p>
                ) : (
                  availablePorts.map((portData) => (
                    <div key={portData.id} className="flex items-center justify-between bg-white p-3 rounded border">
                      <span className="text-sm font-medium">
                        {portData.name}
                      </span>
                      <button
                        onClick={() => connectToPort(portData)}
                        disabled={isConnected}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Connect
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Connection Controls */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Controls</h2>
              
              <div className="space-y-3">
                <button
                  onClick={disconnectPort}
                  disabled={!isConnected}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Disconnect
                </button>
                
                <button
                  onClick={clearData}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Clear Data
                </button>
              </div>

              {isConnected && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Connected!</strong> 
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Device should be sending data now.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Data Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Received Data</h2>
              <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                {receivedData.length} messages
              </span>
            </div>
            
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-80 overflow-y-auto">
              {receivedData.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  <p>No data received yet...</p>
                  <p className="text-xs mt-2">Connect to a device to see data here</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {receivedData.slice(-50).map((item) => ( // Show last 50 messages
                    <div key={item.id} className="flex">
                      <span className="text-blue-400 mr-2">[{item.timestamp}]</span>
                      <span className="break-all">{item.data}</span>
                    </div>
                  ))}
                  {receivedData.length > 50 && (
                    <div className="text-yellow-400 text-center py-2">
                      ... showing last 50 messages of {receivedData.length} total
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">How to use:</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Connect your Arduino/HC-05 device via USB</li>
              <li>Click "Add New Port" and select your device from the browser dialog</li>
              <li>Click "Connect" next to your device in the list</li>
              <li>The system automatically sends '$' to start data transmission</li>
              <li>View real-time data in the terminal above</li>
              <li>Click "Disconnect" to send 'D' command and close connection</li>
            </ol>
            
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-600">
              <strong>Note:</strong> This uses the Web Serial API which requires Chrome 89+, Edge 89+, or Opera 75+.
              Make sure your device sends data when it receives '$' and stops when it receives 'D'.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}