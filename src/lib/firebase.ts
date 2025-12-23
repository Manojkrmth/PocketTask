import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "studio-5358554212-c676c",
  "appId": "1:166226930906:web:aa89f1252645320176c9e3",
  "apiKey": "AIzaSyDP5gF_Hzfj04_Qo4uIDjjs6xsa3anuUpU",
  "authDomain": "studio-5358554212-c676c.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "166226930906"
};

// Initialize Firebase for your new project
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Since you are using Supabase for the database, we are not initializing Firestore.
// const firestore = getFirestore(app);

export { app, auth };
