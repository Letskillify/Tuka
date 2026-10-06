import { initializeApp as initializeClientApp, getApps as getClientApps } from "firebase/app";
import {
    initializeFirestore,
    getFirestore,
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
    apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSy_MISSING",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "tuka-969fa.firebaseapp.com",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "tuka-969fa",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "tuka-969fa.appspot.com",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "12345",
    appId: process.env.VITE_FIREBASE_APP_ID || "1:12345:web:abc",
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-12345"
};

let clientDb;

const backendAppName = "[DEFAULT_BACKEND]";
let backendApp = getClientApps().find(a => a.name === backendAppName);

if (!backendApp) {
    backendApp = initializeClientApp(firebaseConfig, backendAppName);
    try {
        // Exclusively initialize this backend app with long polling to prevent SSR SDK drop
        clientDb = initializeFirestore(backendApp, { experimentalForceLongPolling: true });
    } catch (e) {
        clientDb = getFirestore(backendApp);
    }
} else {
    clientDb = getFirestore(backendApp);
}

let adminDb = null;
let adminAuth = null;

try {
    const adminModule = await import("firebase-admin");
    const admin = adminModule.default || adminModule;
    if (!admin.apps?.length) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                admin.initializeApp({ credential: admin.credential.cert(sa), projectId: process.env.VITE_FIREBASE_PROJECT_ID });
            } catch (e) {
                admin.initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID });
            }
        } else {
            admin.initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID });
        }
    }
    adminDb = admin.firestore();
    adminAuth = admin.auth();
} catch (err) {
    console.warn("[FirebaseServer] firebase-admin not initialized, using client SDK fallback", err?.message);
}

export { clientDb, adminDb, adminAuth, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, runTransaction, serverTimestamp };
