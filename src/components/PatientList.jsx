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
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="ml-4 text-gray-600">Loading patients...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">
              {error}. Please check your Firebase configuration.
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No patients found.
            </div>
          ) : (
            <div className="max-h-[90vh] overflow-y-auto pr-3">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-2 font-semibold text-indigo-700">Name of patient</th>
                    <th className="text-left py-4 px-2 font-semibold text-indigo-700">Phone number</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
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