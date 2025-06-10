
// TODO: Replace with your actual Firebase project configuration
// You can find this in your Firebase project settings:
// Project settings > General > Your apps > Firebase SDK snippet > Config

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validate that all required Firebase config values are present
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

let missingKeys = false;
for (const key of requiredConfigKeys) {
  if (!firebaseConfig[key]) {
    console.warn(`Firebase config missing: NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
    missingKeys = true;
  }
}

if (missingKeys && typeof window !== 'undefined') { // Only show alert in browser, not during build
  // alert("Firebase configuration is incomplete. Please check environment variables. Chat and other Firebase services may not work.");
  // Using console.error for now as alert can be too intrusive during dev.
  console.error("Firebase configuration is incomplete. Please check environment variables. Chat and other Firebase services may not work.");
}


// Initialize Firebase
let app;
if (!getApps().length) {
  // Only initialize if all required keys are present (basic check)
  if (!missingKeys || process.env.NODE_ENV === 'test') { // Allow initialization in test env even with missing keys
     app = initializeApp(firebaseConfig);
  } else {
    console.error("Firebase app initialization skipped due to missing configuration.");
    // Fallback app or handle error appropriately if needed
  }
} else {
  app = getApp();
}

const db = app ? getFirestore(app) : null; // Handle case where app might not be initialized

export { db, app };

