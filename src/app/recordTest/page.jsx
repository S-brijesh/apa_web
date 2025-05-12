// 'use client';

// import { useState, useEffect } from 'react';

// export default function ArduinoSerialConnection() {
//   const [ports, setPorts] = useState([]);
//   const [selectedPort, setSelectedPort] = useState(null);
//   const [reader, setReader] = useState(null);
//   const [writer, setWriter] = useState(null);
//   const [dataLines, setDataLines] = useState([]);
//   const [isConnected, setIsConnected] = useState(false);
//   const [error, setError] = useState('');
//   const [portInfo, setPortInfo] = useState([]);

//   // Check for serial port availability
//   useEffect(() => {
//     const checkSerialAvailability = async () => {
//       try {
//         if (!navigator.serial) {
//           setError('Web Serial API is not supported in this browser. Try Chrome or Edge.');
//           return;
//         }
//       } catch (err) {
//         setError(`Error accessing serial API: ${err.message}`);
//       }
//     };

//     checkSerialAvailability();
//   }, []);

//   // List available ports
//   const handleListPorts = async () => {
//     try {
//       if (!navigator.serial) {
//         setError('Web Serial API is not supported');
//         return;
//       }
      
//       // Get all previously approved ports
//       const availablePorts = await navigator.serial.getPorts();
//       setPorts(availablePorts);
      
//       // Request port access once to get all available ports
//       if (availablePorts.length === 0) {
//         const port = await navigator.serial.requestPort();
//         setPorts([port]);
//         setSelectedPort(port);
//       }
      
//       // Collect info about each port
//       const portDetails = [];
//       for (let i = 0; i < availablePorts.length; i++) {
//         const port = availablePorts[i];
//         // We can only get limited info due to security restrictions
//         portDetails.push({
//           index: i,
//           // Using index as identifier since we can't get much info about ports
//           name: `Port ${i + 1}`
//         });
//       }
//       setPortInfo(portDetails);
      
//     } catch (err) {
//       if (err.name === 'NotFoundError') {
//         setError('No port selected by user.');
//       } else {
//         setError(`Error listing ports: ${err.message}`);
//       }
//     }
//   };

//   // Connect to the selected port
//   const handleConnect = async () => {
//     if (!selectedPort) {
//       setError('Please select a port first.');
//       return;
//     }

//     try {
//       await selectedPort.open({ baudRate: 115200 });
      
//       // Create writer
//       const writerObj = selectedPort.writable.getWriter();
//       setWriter(writerObj);
      
//       // Send $ to begin data transmission
//       const encoder = new TextEncoder();
//       await writerObj.write(encoder.encode('$'));

//       // Create reader and start reading
//       const readerObj = selectedPort.readable.getReader();
//       setReader(readerObj);
      
//       setIsConnected(true);
//       setError('');
//       setDataLines([]); // Clear previous lines
      
//       // Read data in a loop
//       const readLoop = async () => {
//         const decoder = new TextDecoder();
//         let buffer = '';
        
//         try {
//           while (true) {
//             const { value, done } = await readerObj.read();
//             if (done) break;
            
//             const newData = decoder.decode(value);
//             buffer += newData;
            
//             // Process complete lines
//             const lines = buffer.split('\n');
            
//             // If the last line is incomplete, keep it in the buffer
//             if (!buffer.endsWith('\n')) {
//               buffer = lines.pop();
//             } else {
//               buffer = '';
//             }
            
//             // Process complete lines only (empty strings filtered out)
//             const completeLines = lines.filter(line => line.trim() !== '');
            
//             if (completeLines.length > 0) {
//               // Update data lines - newest at the top
//               setDataLines(prevLines => [...completeLines.reverse(), ...prevLines]);
//             }
//           }
//         } catch (err) {
//           if (!selectedPort.readable) {
//             console.log('Port disconnected');
//           } else {
//             setError(`Error reading data: ${err.message}`);
//           }
//         }
//       };

//       readLoop();
      
//     } catch (err) {
//       setError(`Error connecting to port: ${err.message}`);
//     }
//   };

//   // Disconnect from the port
//   const handleDisconnect = async () => {
//     if (!selectedPort) return;
    
//     try {
//       // First send 'D' to stop data transmission
//       if (writer) {
//         const encoder = new TextEncoder();
//         await writer.write(encoder.encode('D'));
//         writer.releaseLock();
//         setWriter(null);
//       }
      
//       // Release the reader
//       if (reader) {
//         try {
//           await reader.cancel();
//           reader.releaseLock();
//           setReader(null);
//         } catch (err) {
//           console.error('Error releasing reader:', err);
//         }
//       }
      
//       // Close the port
//       await selectedPort.close();
//       setIsConnected(false);
      
//     } catch (err) {
//       setError(`Error disconnecting: ${err.message}`);
//     }
//   };

//   // Handle port selection
//   const handlePortSelection = (e) => {
//     const index = parseInt(e.target.value);
//     if (!isNaN(index) && index >= 0 && index < ports.length) {
//       setSelectedPort(ports[index]);
//     } else {
//       setSelectedPort(null);
//     }
//   };

//   return (
//     <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
//       <h1 className="text-2xl font-bold mb-4">Arduino Serial Connection</h1>
      
//       {error && (
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//           {error}
//         </div>
//       )}
      
//       <div className="mb-4">
//         <button 
//           onClick={handleListPorts}
//           disabled={isConnected}
//           className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
//         >
//           List Available Ports
//         </button>
        
//         {portInfo.length > 0 && (
//           <span className="text-green-600 ml-2">
//             {portInfo.length} port(s) available
//           </span>
//         )}
//       </div>
      
//       {portInfo.length > 0 && (
//         <div className="mb-4">
//           <label className="block text-gray-700 mb-2">Select Port:</label>
//           <select 
//             onChange={handlePortSelection}
//             className="border rounded py-2 px-3 text-gray-700 w-full"
//             disabled={isConnected}
//             value={selectedPort ? ports.indexOf(selectedPort) : ""}
//           >
//             <option value="">-- Select a Port --</option>
//             {portInfo.map((port) => (
//               <option key={port.index} value={port.index}>
//                 {port.name}
//               </option>
//             ))}
//           </select>
//         </div>
//       )}
      
//       <div className="mb-4">
//         {!isConnected ? (
//           <button 
//             onClick={handleConnect}
//             disabled={!selectedPort}
//             className={`py-2 px-4 rounded font-bold ${
//               selectedPort 
//                 ? 'bg-green-500 hover:bg-green-700 text-white' 
//                 : 'bg-gray-300 text-gray-500 cursor-not-allowed'
//             }`}
//           >
//             Connect
//           </button>
//         ) : (
//           <button 
//             onClick={handleDisconnect}
//             className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
//           >
//             Disconnect
//           </button>
//         )}
//       </div>
      
//       {isConnected && (
//         <div className="mt-6">
//           <h2 className="text-xl font-semibold mb-2">Received Data (Newest at Top):</h2>
//           <div 
//             className="border border-gray-300 rounded-md p-4 bg-white h-64 overflow-auto data-container"
//             style={{ fontFamily: 'monospace' }}
//           >
//             {dataLines.length > 0 ? (
//               <div className="text-black">
//                 {dataLines.map((line, index) => (
//                   <div key={index} className="py-1 border-b border-gray-100">
//                     {line}
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-gray-500">Waiting for data...</p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }