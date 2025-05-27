"use client";
import React, { useState } from 'react';
// import PatientList from '../components/PatientList';
import PatientDetail from '@/components/PatientDetail';
import PatientList from '@/components/PatientList';



const Index = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handleSelectPatient = (patient) => {
    console.log("patient :");
    setSelectedPatient(patient);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-1">
          <PatientDetail patient={selectedPatient} onBack={handleBackToList} />
          
        </div>
        <div className="md:col-span-1">
          <PatientList 
            onSelectPatient={handleSelectPatient} 
            selectedPatientId={selectedPatient?.id}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
