import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDl5GaGyxN5JnPQPFEDXehPv0TfkW2-NPw",
  authDomain: "tuka-969fa.firebaseapp.com",
  projectId: "tuka-969fa",
  storageBucket: "tuka-969fa.firebasestorage.app",
  messagingSenderId: "188570479628",
  appId: "1:188570479628:web:c265a8ae19df61b772d229",
  measurementId: "G-7QMSGCTXT3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };

