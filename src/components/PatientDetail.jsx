import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ref, listAll, getMetadata } from 'firebase/storage';
import { storage2 } from '@/app/lib/firebase2';

const PatientDetail = ({ patient, onBack }) => {
  const [reportCount, setReportCount] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTestsFromStorage = async () => {
      if (!patient?.docId) return;

      try {
        setLoading(true);
        const folderRef = ref(storage2, `${patient.docId}/`);
        const result = await listAll(folderRef);

        // ✅ Check if folder exists (has items or subfolders)
        if (result.prefixes.length > 0 || result.items.length > 0) {
          console.log('ha mila');
        } else {
          console.log('nahi mila');
          setReportCount(0);
          setTests([]);
          setLoading(false);
          return;
        }

        setReportCount(result.items.length);

        const testPromises = result.items.map(async (itemRef) => {
          try {
            const metadata = await getMetadata(itemRef);
            const fileName = itemRef.name;
            const fileExtension = fileName.split('.').pop();
            const nameWithoutExtension = fileName.replace(`.${fileExtension}`, '');
            const parts = nameWithoutExtension.split('_');

            let testName = parts[0] || 'Unknown Test';
            let testDate = 'N/A';
            let testTime = 'N/A';

            if (parts.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])) {
              testDate = parts[1];
            }
            if (parts.length >= 3 && /^\d{2}-\d{2}$/.test(parts[2])) {
              testTime = parts[2].replace('-', ':');
            }

            const createdDate = new Date(metadata.timeCreated);
            if (testDate === 'N/A') {
              testDate = createdDate.toISOString().split('T')[0];
            }
            if (testTime === 'N/A') {
              testTime = createdDate.toTimeString().split(' ')[0].substring(0, 5);
            }

            return {
              id: itemRef.fullPath,
              name: testName,
              date: testDate,
              time: testTime,
              fileName,
              fileType: fileExtension,
              size: metadata.size,
              created: metadata.timeCreated,
              downloadUrl: itemRef.fullPath
            };
          } catch (error) {
            return {
              id: itemRef.fullPath,
              name: itemRef.name.split('.')[0] || 'Unknown Test',
              date: 'N/A',
              time: 'N/A',
              fileName: itemRef.name,
              fileType: itemRef.name.split('.').pop() || 'unknown',
              size: 0,
              created: new Date().toISOString(),
              downloadUrl: itemRef.fullPath
            };
          }
        });

        const testsData = await Promise.all(testPromises);
        testsData.sort((a, b) => new Date(b.created) - new Date(a.created));

        setTests(testsData);
      } catch (error) {
        console.error('Error fetching tests from storage:', error);
        setReportCount(0);
        setTests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestsFromStorage();
  }, [patient?.docId]);

  if (!patient) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg p-6">
        <p className="text-gray-500 text-lg">Select a patient to view details</p>
      </div>
    );
  }

  const { name, age, gender, height, weight, bmi } = patient;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <div className="grid grid-cols-2 gap-2 text-black">
          <p><span className="font-semibold">Name:</span> {name || 'N/A'}</p>
          <p><span className="font-semibold">Age:</span> {age || 'N/A'}</p>
          <p><span className="font-semibold">Gender:</span> {gender || 'N/A'}</p>
          <p><span className="font-semibold">Height:</span> {height || 'N/A'}</p>
          <p><span className="font-semibold">Weight:</span> {weight || 'N/A'}</p>
          <p><span className="font-semibold">BMI:</span> {bmi || 'N/A'}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">PATIENT TEST HISTORY</h3>
          <button className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm">
            {reportCount === null ? 'Loading...' : `${reportCount} report${reportCount !== 1 ? 's' : ''}`}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-600">Loading tests...</p>
          </div>
        ) : tests.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tests.map((test, index) => (
              <div key={test.id || index} className="bg-blue-100 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-blue-800 font-medium text-lg">{test.name}</p>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>Date: {test.date} | Time: {test.time}</p>
                      <p>File: {test.fileName} ({formatFileSize(test.size)})</p>
                      <p>Type: {test.fileType.toUpperCase()}</p>
                    </div>
                  </div>
                  <ArrowLeft className="transform rotate-180 text-blue-800 mt-1" size={20} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No test reports found in storage.</p>
            <p className="text-sm text-gray-500 mt-1">
              Upload test reports to folder: {patient.docId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetail;
