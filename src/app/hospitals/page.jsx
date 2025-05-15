// pages/hospitals.js
"use client";
import { useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const HospitalsPage = () => {
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const hospitalsRef = collection(db, 'hospitals');
        const snapshot = await getDocs(hospitalsRef);
        const hospitals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Hospitals:', hospitals);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
      }
    };

    fetchHospitals();
  }, []);

  return (
    <div>
      <h1>Hospitals</h1>
      <p>Check console for hospital data</p>
    </div>
  );
};

export default HospitalsPage;
