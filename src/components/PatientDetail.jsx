import React from 'react';
import { ArrowLeft } from 'lucide-react';

const PatientDetail = ({ patient, onBack }) => {
  if (!patient) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg p-6">
        <p className="text-gray-500 text-lg">Select a patient to view details</p>
      </div>
    );
  }

  // Using placeholder data for additional patient details
  const patientDetails = {
    age: '21 years',
    gender: 'M',
    height: '164 cm',
    weight: '49 kg',
    bmi: '18.2',
    tests: [
      { id: 1, name: 'Test 1', date: '22 August 2023', time: '11.03 am' },
      { id: 2, name: 'Test 2', date: '17 August 2023', time: '06.00 pm' },
      { id: 3, name: 'Test 3', date: '21 July 2023', time: '11.03 am' },
      { id: 4, name: 'Test 4', date: '15 July 2023', time: '04.30 pm' }
    ]
  };

  return (
    <div className="bg-indigo-200 rounded-lg overflow-hidden shadow-lg h-full">
      <div className="p-4 bg-indigo-300 flex items-center">
        <button className="mr-4 text-indigo-800" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-center text-white flex-1 mr-6">PATIENT DETAILS</h2>
      </div>

      <div className="p-4 bg-blue-100 m-4 rounded-lg">
        <div className="grid grid-cols-2 gap-2">
          <p><span className="font-semibold">Name:</span> {patient.name}</p>
          <p><span className="font-semibold">Age:</span> {patientDetails.age}</p>
          <p><span className="font-semibold">Gender:</span> {patientDetails.gender}</p>
          <p><span className="font-semibold">Height:</span> {patientDetails.height}</p>
          <p><span className="font-semibold">Weight:</span> {patientDetails.weight}</p>
          <p><span className="font-semibold">BMI:</span> {patientDetails.bmi}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">PATIENT TEST HISTORY</h3>
          <button className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm">
            Show report
          </button>
        </div>

        <div className="space-y-2">
          {patientDetails.tests.map((test) => (
            <div key={test.id} className="bg-blue-100 p-4 rounded-lg flex justify-between items-center">
              <p className="text-blue-800 font-medium">
                {test.name}: {test.date} | {test.time}
              </p>
              <ArrowLeft className="transform rotate-180 text-blue-800" size={20} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;