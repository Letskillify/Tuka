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

import fs from "node:fs";
import path from "node:path";

const loadEnvFallback = () => {
    if (process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID) return;
    try {
        const envPath = path.resolve(process.cwd(), ".env");
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, "utf8");
            content.split(/\r?\n/).forEach((line) => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
                    const eqIdx = trimmed.indexOf("=");
                    const key = trimmed.substring(0, eqIdx).trim();
                    let val = trimmed.substring(eqIdx + 1).trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length - 1);
                    }
                    if (!process.env[key]) {
                        process.env[key] = val;
                    }
                }
            });
        }
    } catch (e) {
        console.warn("[FirebaseServer] Warning loading .env fallback:", e.message);
    }
};

loadEnvFallback();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBbVB_qxPmeWH3JIJah-sVsVYLqRsN_jOA",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "tukapro-306e9.firebaseapp.com",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "tukapro-306e9",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "tukapro-306e9.firebasestorage.app",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "879280514021",
    appId: process.env.VITE_FIREBASE_APP_ID || "1:879280514021:web:9d58bf354bd99cdf12c50c",
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Y2PKV153FD"
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
    const { initializeApp: initAdminApp, getApps: getAdminApps, cert } = await import("firebase-admin/app");
    const { getFirestore: getAdminFirestore } = await import("firebase-admin/firestore");
    const { getAuth: getAdminAuth } = await import("firebase-admin/auth");

    let app;
    if (!getAdminApps().length) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                let sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                if (sa && sa.private_key) {
                    sa.private_key = sa.private_key.replace(/\\n/g, "\n");
                }
                app = initAdminApp({ credential: cert(sa), projectId: process.env.VITE_FIREBASE_PROJECT_ID });
            } catch (e) {
                app = initAdminApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID });
            }
        } else {
            app = initAdminApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID });
        }
    } else {
        app = getAdminApps()[0];
    }
    adminDb = getAdminFirestore(app);
    adminAuth = getAdminAuth(app);
} catch (err) {
    console.warn("[FirebaseServer] firebase-admin not initialized, using client SDK fallback", err?.message);
}

export { clientDb, adminDb, adminAuth, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, runTransaction, serverTimestamp };
