// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBDeYi5YTDma6Pk8PyPzhOWtm_EBbwC0Zw",
  authDomain: "spear-mint-dac7c.firebaseapp.com",
  projectId: "spear-mint-dac7c",
  storageBucket: "spear-mint-dac7c.firebasestorage.app",
  messagingSenderId: "720926553155",
  appId: "1:720926553155:web:60120570d5283ec2ba90f6",
  measurementId: "G-EFQSK4SX67"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
