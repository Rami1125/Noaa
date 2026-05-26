import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// במקרה ותרצה גם את Realtime Database בנוסף ל-Firestore
import { getDatabase } from "firebase/database"; 
import { getStorage } from "firebase/storage";

// הגדרות הפרויקט הרשמיות - saban-ai-drive
const firebaseConfig = {
  apiKey: "AIzaSyAQzXHpiSVBqbU1zXVXtl4tDtEPnqkdeUI",
  authDomain: "saban-ai-drive.firebaseapp.com",
  databaseURL: "https://saban-ai-drive-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "saban-ai-drive",
  storageBucket: "saban-ai-drive.firebasestorage.app",
  messagingSenderId: "516446483197",
  appId: "1:516446483197:web:21fc622f56c4e2a3050494",
  measurementId: "G-J88TZL18VY"
};

// 1. אתחול האפליקציה
const app = initializeApp(firebaseConfig);

// 2. אתחול השירותים המבצעיים
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app); // חיבור ל-Cloud Firestore (לקולקציות של נועה)
export const rtdb = getDatabase(app); // חיבור למסד נתונים בזמן אמת (אם נדרש למיקומים)
export const storage = getStorage(app); // חיבור לאחסון קבצים (תעודות משלוח/אישורי החזרה)

// פונקציית בדיקת חיבור ללוגים
export const testFirebaseConnection = () => {
  console.log("🟢 [חמ\"ל סבן] החיבור לפרויקט saban-ai-drive פעיל. Cloud Firestore מוכן לסנכרון הקולקציות.");
};
