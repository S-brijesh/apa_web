import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ref, listAll, getMetadata } from 'firebase/storage';

import { storage } from '@/app/lib/firebase2';

const PatientDetail = ({ patient, onBack }) => {
  const [reportCount, setReportCount] = useState(null);
  const [testsByDate, setTestsByDate] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to convert timestamp to readable date
  const convertTimestampToDate = (rawName) => {
  try {
    // Extract number between dollar signs, e.g., "$1736233109$" → "1736233109"
    const match = rawName.match(/\$(\d+)\$/);
    const timestamp = match ? match[1] : rawName;
    const numTimestamp = parseInt(timestamp);

    const date = numTimestamp.toString().length === 10
      ? new Date(numTimestamp * 1000)
      : new Date(numTimestamp);

    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      fullDateTime: date.toLocaleString(),
      cleanTimestamp: timestamp
    };
  } catch (error) {
    return {
      date: rawName,
      time: '',
      fullDateTime: rawName,
      cleanTimestamp: rawName
    };
  }
};


  // OPTIMIZATION 1: Parallel Processing with Promise.all
  const fetchTestDataOptimized = async (patientId) => {
    try {
      setLoading(true);
      setError(null);
      
      const patientRef = ref(storage, patientId);
      const patientResult = await listAll(patientRef);

      if (patientResult.prefixes.length === 0) {
        setTestsByDate([]);
        setReportCount(0);
        return;
      }

      console.log(`🔍 Found ${patientResult.prefixes.length} date folders for patient: ${patientId}`);

      // OPTIMIZATION 2: Process all date folders in parallel
      const datePromises = patientResult.prefixes.map(async (dateFolderRef) => {
        const dateTimestamp = dateFolderRef.name;
        const dateInfo = convertTimestampToDate(dateTimestamp);
        
        try {
          const dateResult = await listAll(dateFolderRef);
          
          // OPTIMIZATION 3: Process all test folders in parallel for this date
          const testPromises = dateResult.prefixes.map(async (testFolderRef) => {
            const testTimestamp = testFolderRef.name;
            const testInfo = convertTimestampToDate(testTimestamp);
            
            try {
              const testResult = await listAll(testFolderRef);
              
              // OPTIMIZATION 4: Get metadata in parallel, but limit concurrency
              const filePromises = testResult.items.slice(0, 10).map(async (fileRef) => {
                try {
                  // Use Promise.race for timeout on slow metadata calls
                  const metadataPromise = getMetadata(fileRef);
                  const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Metadata timeout')), 3000)
                  );
                  
                  const metadata = await Promise.race([metadataPromise, timeoutPromise]);
                  
                  return {
                    fileName: fileRef.name,
                    size: metadata.size,
                    fileType: fileRef.name.split('.').pop() || 'unknown',
                    fullPath: fileRef.fullPath,
                    contentType: metadata.contentType || 'unknown'
                  };
                } catch (metadataError) {
                  // Fallback without metadata
                  return {
                    fileName: fileRef.name,
                    size: 0,
                    fileType: fileRef.name.split('.').pop() || 'unknown',
                    fullPath: fileRef.fullPath,
                    contentType: 'unknown'
                  };
                }
              });

              const testFiles = await Promise.all(filePromises);
              
              return {
                id: testInfo.cleanTimestamp,
                name: `Test ${testInfo.time}`,
                date: testInfo.date,
                time: testInfo.time,
                timestamp: testInfo.cleanTimestamp,
                files: testFiles,
                fileCount: testFiles.length,
                totalFiles: testResult.items.length // Show if there are more files
              };
            } catch (testError) {
              console.warn(`Error processing test ${testTimestamp}:`, testError);
              return {
                id: testTimestamp,
                name: `Test ${testInfo.time}`,
                date: testInfo.date,
                time: testInfo.time,
                timestamp: testTimestamp,
                files: [],
                fileCount: 0,
                error: true
              };
            }
          });

          const testsForThisDate = await Promise.all(testPromises);
          
          // Filter out failed tests and sort
          const validTests = testsForThisDate.filter(test => test).sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

          return {
            dateTimestamp: dateInfo.cleanTimestamp,
            date: dateInfo.date,
            fullDateTime: dateInfo.fullDateTime,
            tests: validTests,
            testCount: validTests.length
          };
        } catch (dateError) {
          console.warn(`Error processing date folder ${dateTimestamp}:`, dateError);
          return null;
        }
      });

      // Wait for all date processing to complete
      const allTestsByDate = await Promise.all(datePromises);
      
      // Filter out failed dates and sort
      const validTestsByDate = allTestsByDate
        .filter(dateGroup => dateGroup && dateGroup.tests.length > 0)
        .sort((a, b) => parseInt(b.dateTimestamp) - parseInt(a.dateTimestamp));

      const totalTestCount = validTestsByDate.reduce((sum, dateGroup) => sum + dateGroup.testCount, 0);

      setTestsByDate(validTestsByDate);
      setReportCount(totalTestCount);
      
      console.log(`📊 Optimized fetch completed: ${validTestsByDate.length} date folders with ${totalTestCount} total tests`);
      
    } catch (error) {
      console.error("❌ Error fetching test data:", error);
      setError(error.message);
      setReportCount(0);
    } finally {
      setLoading(false);
    }
  };

  // OPTIMIZATION 5: Lazy loading with progressive display
  const [showAllFiles, setShowAllFiles] = useState({});
  
  const toggleShowAllFiles = (testId) => {
    setShowAllFiles(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }));
  };

  useEffect(() => {
    if (patient && patient.id) {
      fetchTestDataOptimized(patient.id);
    }
  }, [patient]);

  if (!patient) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg p-6">
        <p className="text-gray-500 text-lg">Select a patient to view details</p>
      </div>
    );
  }

  const {
    name,
    age,
    gender,
    height,
    weight,
    bmi,
    id
  } = patient;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-indigo-200 rounded-lg overflow-hidden shadow-lg h-full">
      {/* Header */}
      <div className="p-4 bg-indigo-300 flex items-center">
        <button className="mr-4 text-indigo-800" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-center text-white flex-1 mr-6">PATIENT DETAILS</h2>
      </div>

      {/* Patient Info */}
      <div className="p-4 bg-blue-100 m-4 rounded-lg">
        <div className="grid grid-cols-2 gap-2 text-black">
          {/* <p><span className="font-semibold">ID:</span> {id || 'N/A'}</p> */}
          <p><span className="font-semibold">Name:</span> {name || 'N/A'}</p>
          <p><span className="font-semibold">Age:</span> {age || 'N/A'}</p>
          <p><span className="font-semibold">Gender:</span> {gender || 'N/A'}</p>
          <p><span className="font-semibold">Height:</span> {height || 'N/A'}</p>
          <p><span className="font-semibold">Weight:</span> {weight || 'N/A'}</p>
          <p><span className="font-semibold">BMI:</span> {bmi || 'N/A'}</p>
        </div>
      </div>

      {/* Test History */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">PATIENT TEST HISTORY</h3>
          <button className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm">
            {reportCount === null ? 'Loading...' : `${reportCount} test${reportCount !== 1 ? 's' : ''}`}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-600">Loading tests...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">Error loading tests: {error}</p>
            <button 
              onClick={() => fetchTestDataOptimized(patient.id)}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : testsByDate.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {testsByDate.map((dateGroup, dateIndex) => (
              <div key={dateGroup.dateTimestamp} className="border border-blue-300 rounded-lg overflow-hidden">
                {/* Date Header */}
                <div className="bg-blue-200 px-4 py-2">
                  <h4 className="font-semibold text-blue-900">
                    {dateGroup.date} ({dateGroup.testCount} test{dateGroup.testCount !== 1 ? 's' : ''})
                  </h4>
                </div>
                
                {/* Tests for this date */}
                <div className="space-y-2 p-2">
                  {dateGroup.tests.map((test, testIndex) => (
                    <div key={test.id} className="bg-blue-100 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-blue-800 font-medium text-lg">{test.name}</p>
                          <div className="text-sm text-gray-600 mt-1">
                            <p>Time: {test.time}</p>
                            <p>Test ID: {test.id}</p>
                            {test.error && (
                              <p className="text-red-600 text-xs">⚠️ Error loading some data</p>
                            )}
                            {test.files.length > 0 ? (
                              <div className="mt-2">
                                <div className="flex justify-between items-center">
                                  <p className="font-medium">
                                    Files ({test.fileCount}
                                    {test.totalFiles > test.fileCount && ` of ${test.totalFiles}`})
                                  </p>
                                  {test.files.length > 3 && (
                                    <button 
                                      onClick={() => toggleShowAllFiles(test.id)}
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      {showAllFiles[test.id] ? 'Show Less' : 'Show All'}
                                    </button>
                                  )}
                                </div>
                                {test.files.slice(0, showAllFiles[test.id] ? undefined : 3).map((file, fileIndex) => (
                                  <div key={fileIndex} className="ml-2 text-xs">
                                    <p>• {file.fileName} ({formatFileSize(file.size)}) - {file.fileType.toUpperCase()}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-orange-600 text-xs mt-1">No files found in this test folder</p>
                            )}
                          </div>
                        </div>
                        <ArrowLeft className="transform rotate-180 text-blue-800 mt-1" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No test reports found in storage.</p>
            <p className="text-sm text-gray-500 mt-1">
              Upload test reports to folder structure: patients/{patient.name}/[date]/[test]
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetail;