'use client';
import { useState } from 'react';

export default function NewTestForm() {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [sensorCount, setSensorCount] = useState('');

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-100">
      <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-3xl p-8 w-[400px] shadow-lg">
        <button className="text-white text-xl mb-4">{'←'}</button>
        <h2 className="text-center text-white text-3xl font-semibold mb-8">NEW TEST</h2>

        <div className="mb-6">
          <label className="block text-white text-sm mb-1">Name of the patient</label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full bg-transparent border-b border-white text-white py-2 focus:outline-none"
          >
            <option value="" disabled>Select patient</option>
            <option value="John">John</option>
            <option value="Jane">Jane</option>
          </select>
        </div>

        <div className="mb-10">
          <label className="block text-white text-sm mb-1">Number of sensors attached</label>
          <select
            value={sensorCount}
            onChange={(e) => setSensorCount(e.target.value)}
            className="w-full bg-transparent border-b border-white text-white py-2 focus:outline-none"
          >
            <option value="" disabled>Select number</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>

        <button className="w-full py-3 bg-white text-blue-700 rounded-xl font-semibold shadow-md hover:bg-blue-100 transition">
          Start recording
        </button>
      </div>
    </div>
  );
}
