import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db2 } from '@/app/lib/firebase2';

export const getPatients = async () => {
  try {
    const patientsCollection = collection(db2, 'patients');
    const patientsSnapshot = await getDocs(query(patientsCollection, orderBy('name')));
    return patientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
};

export const searchPatients = async (searchTerm) => {
  try {
    const patientsCollection = collection(db2, 'patients');
    const q = query(
      patientsCollection,
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff')
    );
    const patientsSnapshot = await getDocs(q);
    return patientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error searching patients:', error);
    return [];
  }
};