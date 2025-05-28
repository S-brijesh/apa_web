"use client";
import { useEffect, useState } from 'react';
import { storage } from '../lib/firebase2';
import { ref, listAll } from 'firebase/storage';

export default function ViewTestFolders() {
  const patientId = "0axbt1vmvsqFZXefZ4zw"; // Replace as needed
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to convert timestamp to readable date
  const convertTimestampToDate = (timestamp) => {
    try {
      // Handle both seconds and milliseconds timestamps
      const numTimestamp = parseInt(timestamp);
      const date = numTimestamp.toString().length === 10 
        ? new Date(numTimestamp * 1000) 
        : new Date(numTimestamp);
      
      return date.toLocaleString();
    } catch (error) {
      console.warn(`Could not convert timestamp: ${timestamp}`);
      return timestamp; // Return original if conversion fails
    }
  };

  useEffect(() => {
    const listAllTestsForPatient = async () => {
      try {
        setLoading(true);
        const patientRef = ref(storage, patientId);
        const patientResult = await listAll(patientRef);

        console.log(`🔍 Found ${patientResult.prefixes.length} date folders for patient: ${patientId}`);

        const allTestData = [];

        // Iterate through all date folders
        for (const dateFolderRef of patientResult.prefixes) {
          const dateTimestamp = dateFolderRef.name;
          const readableDate = convertTimestampToDate(dateTimestamp);
          
          console.log(`📅 Processing date folder: ${dateTimestamp} (${readableDate})`);

          try {
            // List all test folders under this date
            const dateResult = await listAll(dateFolderRef);
            
            const testsForThisDate = [];
            
            for (const testFolderRef of dateResult.prefixes) {
              const testTimestamp = testFolderRef.name;
              const readableTestTime = convertTimestampToDate(testTimestamp);
              
              testsForThisDate.push({
                testId: testTimestamp,
                readableTestTime: readableTestTime,
                fullPath: testFolderRef.fullPath
              });
            }

            // Also check for any files directly under the date folder
            if (dateResult.items.length > 0) {
              console.log(`📄 Found ${dateResult.items.length} files directly under date ${dateTimestamp}`);
            }

            allTestData.push({
              dateTimestamp: dateTimestamp,
              readableDate: readableDate,
              tests: testsForThisDate,
              totalTests: testsForThisDate.length
            });

            console.log(`✅ Found ${testsForThisDate.length} tests for date ${dateTimestamp}`);
            
          } catch (dateError) {
            console.error(`❌ Error processing date folder ${dateTimestamp}:`, dateError);
          }
        }

        setTestData(allTestData);
        
        // Summary logging
        const totalTests = allTestData.reduce((sum, dateData) => sum + dateData.totalTests, 0);
        console.log(`📊 Summary: Found ${allTestData.length} date folders with ${totalTests} total tests`);
        
      } catch (error) {
        console.error("❌ Error fetching test data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    listAllTestsForPatient();
  }, [patientId]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Test Folders for patient ID: {patientId}</h1>
        <p>Loading test data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Test Folders for patient ID: {patientId}</h1>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Folders for patient ID: {patientId}</h1>
      
      {testData.length === 0 ? (
        <p>No test data found for this patient.</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Summary</h2>
            <p>Total Date Folders: {testData.length}</p>
            <p>Total Tests: {testData.reduce((sum, dateData) => sum + dateData.totalTests, 0)}</p>
          </div>

          {testData.map((dateData, index) => (
            <div key={dateData.dateTimestamp} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">
                Date Folder #{index + 1}
              </h2>
              <div className="mb-3">
                <p><strong>Timestamp:</strong> {dateData.dateTimestamp}</p>
                <p><strong>Readable Date:</strong> {dateData.readableDate}</p>
                <p><strong>Number of Tests:</strong> {dateData.totalTests}</p>
              </div>
              
              {dateData.tests.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Tests:</h3>
                  <div className="space-y-2">
                    {dateData.tests.map((test, testIndex) => (
                      <div key={test.testId} className="bg-gray-50 p-3 rounded">
                        <p><strong>Test #{testIndex + 1} ID:</strong> {test.testId}</p>
                        <p><strong>Readable Time:</strong> {test.readableTestTime}</p>
                        <p><strong>Full Path:</strong> {test.fullPath}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">
          Check the browser console for detailed logging information.
        </p>
      </div>
    </div>
  );
}