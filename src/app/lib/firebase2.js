import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage'; // ✅ Storage import

const firebaseConfig2 = {
  apiKey: "AIzaSyDYyn-HAqiAJjdo2Z8_we0kyG0DFliUuKM",
  authDomain: "apadb-v2-replica.firebaseapp.com",
  projectId: "apadb-v2-replica",
  storageBucket: "apadb-v2-replica.appspot.com",
  messagingSenderId: "90550258908",
  appId: "1:90550258908:web:7da6de3ca82e317aabf819",
  measurementId: "G-TZGE30WQWB"
};

let app2;

if (!getApps().length) {
  app2 = initializeApp(firebaseConfig2);
  console.log("Firebase initialized");
} else {
  app2 = getApp();
  console.log("Firebase app already initialized");
}

const db2 = getFirestore(app2);
const auth2 = getAuth(app2);
const storage2 = getStorage(app2); // ✅ Initialize Storage

export { db2, auth2, storage2 }; // ✅ Export it
