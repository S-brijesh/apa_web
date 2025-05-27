"use client";
import { useEffect } from 'react';
import { storage } from '../lib/firebase2';
import { ref, listAll } from 'firebase/storage';

export default function ViewTestFolders() {
  const patientId = "0G6Wah2WqGPtMp9f9eCA"; // Replace as needed

  useEffect(() => {
    const listTestFolders = async () => {
      try {
        const patientRef = ref(storage, patientId);
        const result = await listAll(patientRef);

        // Expecting exactly one folder inside patientId
        if (result.prefixes.length === 0) {
          console.log(`No folders found inside patient folder: ${patientId}`);
          return;
        }

        const innerFolderRef = result.prefixes[0]; // Assuming one folder (like "tests")
        console.log(`🔍 Found folder: ${innerFolderRef.name}`);

        const innerResult = await listAll(innerFolderRef);

        if (innerResult.prefixes.length === 0) {
          console.log(`No test folders found inside ${innerFolderRef.name}`);
        } else {
          console.log(`📁 Test folders inside ${innerFolderRef.name}:`);
          innerResult.prefixes.forEach((folderRef) => {
            console.log(folderRef.name);
          });
        }
      } catch (error) {
        console.error("❌ Error fetching test folders:", error);
      }
    };

    listTestFolders();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Test Folders for patient ID: {patientId}</h1>
      <p>Check the browser console for the list of test folders.</p>
    </div>
  );
}
