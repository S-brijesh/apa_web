// lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; // Optional
import { getAuth } from 'firebase/auth'; // Optional

// const firebaseConfig = {
//   apiKey: "AIzaSyDYyn-HAqiAJjdo2Z8_we0kyG0DFliUuKM",
//   authDomain: "apadb-v2-replica.firebaseapp.com",
//   projectId: "apadb-v2-replica",
//   storageBucket: "apadb-v2-replica.appspot.com",
//   messagingSenderId: "90550258908",
//   appId: "1:90550258908:web:7da6de3ca82e317aabf819",
//   measurementId: "G-TZGE30WQWB"
// };
const firebaseConfig2 = {
  apiKey: "AIzaSyDYyn-HAqiAJjdo2Z8_we0kyG0DFliUuKM",
  authDomain: "apadb-v2-replica.firebaseapp.com",
  projectId: "apadb-v2-replica",
  storageBucket: "apadb-v2-replica.appspot.com",
  messagingSenderId: "90550258908",
  appId: "1:90550258908:web:7da6de3ca82e317aabf819",
  measurementId: "G-TZGE30WQWB"
};

const firebaseConfig = {
    apiKey: "AIzaSyAc0lGU3SkNpq_3im9HXBDeEIfz9sE6OYs",
    authDomain: "arterypulseanalyzer.firebaseapp.com",
    databaseURL: "https://arterypulseanalyzer.firebaseio.com",
    projectId: "arterypulseanalyzer",
    storageBucket: "arterypulseanalyzer.appspot.com",
    messagingSenderId: "367434956236",
    appId: "1:367434956236:web:30f044b0c21dffd5ecb169"
}

// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let app;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized");
} else {
  app = getApp();
  console.log("Firebase app already initialized");
}
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
