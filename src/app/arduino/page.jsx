'use client';
import { useState, useRef } from 'react';
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

  const connectToPort = async () => {
    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 115200 });

      const textDecoder = new TextDecoderStream();
      selectedPort.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(selectedPort.writable);
      const writer = textEncoder.writable.getWriter();

      setPort(selectedPort);
      setReader(reader);
      setWriter(writer);
      setIsReading(true);

      listenToPort(reader);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const listenToPort = async (reader) => {
    while (true) {
      try {
        const { value, done } = await reader.read();
        if (done) break;

        if (value?.includes('$')) {
          const clean = value.trim();
          setData((prev) => prev + '\n' + clean);

          const match = clean.match(/\$(\d+)&(\d+)#(\d+)/);
          if (match) {
            const [_, val1, val2, timestamp] = match;
            setPlotData((prev) => [
              ...prev.slice(-50),
              {
                timestamp: +timestamp,
                value1: +val1,
                value2: +val2,
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Read error:', err);
        break;
      }
    }
  };

  const requestData = async () => {
    if (writer) {
      await writer.write('$');
    }
  };

  const stopCommunication = async () => {
    if (writer) await writer.write('D');
    if (reader) {
      await reader.cancel();
      setReader(null);
    }
    if (port) {
      await port.close();
      setPort(null);
    }
    setIsReading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Arduino Real-Time Data Plot</h1>

      {!port ? (
        <button onClick={connectToPort} className="bg-blue-600 text-white px-4 py-2 rounded">
          Connect to Arduino
        </button>
      ) : (
        <div className="flex gap-4">
          <button onClick={requestData} className="bg-green-600 text-white px-4 py-2 rounded">
            Request Data ($)
          </button>
          <button onClick={stopCommunication} className="bg-red-600 text-white px-4 py-2 rounded">
            Stop (D)
          </button>
        </div>
      )}

      <div className="mt-6 bg-gray-100 p-4 rounded h-64 overflow-auto font-mono whitespace-pre-wrap text-black">
        {data || 'No data received yet...'}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Graph 1: $ Value</h2>
        <LineChart width={700} height={250} data={plotData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value1" stroke="#8884d8" name="$ Value" />
        </LineChart>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Graph 2: & Value</h2>
        <LineChart width={700} height={250} data={plotData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value2" stroke="#82ca9d" name="& Value" />
        </LineChart>
      </div>
    </div>
  );
}
