import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getPatients, searchPatients } from '../services/patientService';
import SearchBar from './SearchBar';
import AlphabeticalIndex from './AlphabeticalIndex';
import { toast } from 'sonner';

const PatientList = ({ onSelectPatient, selectedPatientId }) => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await getPatients();
      setPatients(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch patients');
      toast.error('Failed to load patients data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchPatients();
      return;
    }
    
    try {
      setLoading(true);
      const results = await searchPatients(searchTerm.trim());
      setPatients(results);
      setLoading(false);
    } catch (err) {
      setError('Failed to search patients');
      toast.error('Search operation failed');
      setLoading(false);
    }
  };

  const handleSelectLetter = async (letter) => {
    setSearchTerm(letter);
    try {
      setLoading(true);
      const results = await searchPatients(letter);
      setPatients(results);
      setLoading(false);
    } catch (err) {
      setError('Failed to filter patients');
      toast.error('Filter operation failed');
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    fetchPatients();
  };

  // Placeholder for empty state when no Firebase data is available
  const patientPlaceholders = loading ? [] : [
    { id: 'p1', name: 'Abhishek Jadhav', phone: '9876543210' },
    { id: 'p2', name: 'Baban Patil', phone: '9876543210' },
    { id: 'p3', name: 'Chetan Yadav', phone: '9876543210' },
    { id: 'p4', name: 'Dave Bhandari', phone: '9876543210' },
    { id: 'p5', name: 'Esha Dhar', phone: '9876543210' },
    { id: 'p6', name: 'Farhan Akhtar', phone: '9876543210' },
    { id: 'p7', name: 'Gouri Katte', phone: '9876543210' },
    { id: 'p8', name: 'Harsh Satam', phone: '9876543210' },
  ];
  
  // Use actual Firebase data if available, otherwise use placeholders
  const displayedPatients = patients.length > 0 ? patients : patientPlaceholders;

  return (
    <div className="max-w-full bg-white rounded-lg shadow-lg overflow-hidden p-5 h-full">
      <header className="mb-6 flex items-center">
        <h1 className="text-2xl font-bold text-indigo-700">List of Patients</h1>
      </header>
      
      <div className="mb-8">
        <SearchBar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          handleSearch={handleSearch} 
        />
      </div>
      
      <div className="flex">
        <div className="flex-grow">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">
              {error}. Please check your Firebase configuration.
            </div>
          ) : displayedPatients.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No patients found.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-3">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-2 font-semibold text-indigo-700">Name of patient</th>
                    <th className="text-left py-4 px-2 font-semibold text-indigo-700">Phone number</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPatients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedPatientId === patient.id ? 'bg-indigo-50' : ''}`}
                      onClick={() => onSelectPatient(patient)}
                    >
                      <td className="py-4 px-2 text-black">{patient.name}</td>
                      <td className="py-4 px-2 text-black">{patient.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <AlphabeticalIndex onSelectLetter={handleSelectLetter} />
      </div>
    </div>
  );
};

export default PatientList;