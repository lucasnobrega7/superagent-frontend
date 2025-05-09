import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAymaXwMJQdKyUl9HVxW7VgUYS_RSA3qgs",
  authDomain: "sabrinaai-2a39e.firebaseapp.com",
  databaseURL: "https://sabrinaai-2a39e-default-rtdb.firebaseio.com",
  projectId: "sabrinaai-2a39e",
  storageBucket: "sabrinaai-2a39e.firebasestorage.app",
  messagingSenderId: "17644518588",
  appId: "1:17644518588:web:2749152df20c54b957a4b9",
  measurementId: "G-7NCK9MG4H7"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Define the region for Firebase Functions (should match server-side)
const FUNCTION_REGION = "us-central1";
const functions = getFunctions(app, FUNCTION_REGION);

// Connect to Firebase emulators in development
if (process.env.NODE_ENV === 'development') {
  const host = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_HOST || 'localhost';
  const port = Number(process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_PORT) || 5001;
  
  connectFunctionsEmulator(functions, host, port);
  console.log(`Connected to Firebase Functions emulator at ${host}:${port} in region ${FUNCTION_REGION}`);
}

// Initialize Firebase Storage
const storage = getStorage(app);

// Initialize Analytics only in browser and if supported
let analytics: any = null;

if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    }
  }).catch(e => {
    console.error("Analytics not supported:", e);
  });
}

export { app, auth, db, functions, storage, analytics };