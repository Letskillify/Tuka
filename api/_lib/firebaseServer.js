import { initializeApp as initializeClientApp, getApps as getClientApps } from "firebase/app";
import { 
  getFirestore as getClientFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  runTransaction, 
  serverTimestamp 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDl5GaGyxN5JnPQPFEDXehPv0TfkW2-NPw",
  authDomain: "tuka-969fa.firebaseapp.com",
  projectId: "tuka-969fa",
  storageBucket: "tuka-969fa.firebasestorage.app",
  messagingSenderId: "188570479628",
  appId: "1:188570479628:web:c265a8ae19df61b772d229",
  measurementId: "G-7QMSGCTXT3"
};

let clientDb;
if (getClientApps().length === 0) {
  const clientApp = initializeClientApp(firebaseConfig);
  clientDb = getClientFirestore(clientApp);
} else {
  clientDb = getClientFirestore();
}

let adminDb = null;
let adminAuth = null;

try {
  const adminModule = await import("firebase-admin");
  const admin = adminModule.default;
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({ credential: admin.credential.cert(sa), projectId: "tuka-969fa" });
      } catch (e) {
        admin.initializeApp({ projectId: "tuka-969fa" });
      }
    } else {
      admin.initializeApp({ projectId: "tuka-969fa" });
    }
  }
  adminDb = admin.firestore();
  adminAuth = admin.auth();
} catch (err) {
  console.warn("[FirebaseServer] firebase-admin not initialized, using client SDK fallback", err?.message);
}

export { clientDb, adminDb, adminAuth, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, runTransaction, serverTimestamp };
