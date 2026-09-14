import React, { useEffect, useState } from "react";
import { auth, db, googleProvider } from "./Firebase";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signInWithCustomToken, 
  signOut,
  updatePassword as firebaseUpdatePassword
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { AuthContext } from "./useAuth";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncGuestOrders = async (userData) => {
    if (!userData || !userData.email || !userData.uid) return;
    try {
      await fetch("/api/orders/sync-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.uid, uid: userData.uid, email: userData.email })
      });
    } catch (err) {
      console.error("Guest order sync error:", err);
    }
  };

  useEffect(() => {
    let unsubFirestore = () => {};

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        
        unsubFirestore();
        unsubFirestore = onSnapshot(userRef, async (snap) => {
          let profileData = {};
          if (snap.exists()) {
            profileData = snap.data();
          } else {
            profileData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              authProvider: firebaseUser.providerData?.[0]?.providerId || "firebase",
              emailVerified: firebaseUser.emailVerified
            };
            try {
              await setDoc(userRef, profileData);
            } catch (e) {
              console.error("User doc init error:", e);
            }
          }

          const combinedUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: profileData.displayName || firebaseUser.displayName || emailToName(firebaseUser.email),
            photoURL: firebaseUser.photoURL || profileData.photoURL || null,
            emailVerified: firebaseUser.emailVerified,
            ...profileData
          };

          setUser(combinedUser);
          localStorage.setItem("tuka_user", JSON.stringify(combinedUser));
          syncGuestOrders(combinedUser);
          setLoading(false);
        });
      } else {
        // Fallback: check localStorage session if offline/dev fallback
        const storedUser = localStorage.getItem("tuka_user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            syncGuestOrders(parsed);
          } catch (e) {
            setUser(null);
            localStorage.removeItem("tuka_user");
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubFirestore();
    };
  }, []);

  const emailToName = (email) => {
    if (!email) return "Valued Patron";
    const namePart = email.split("@")[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const safeJsonResponse = async (res) => {
    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      if (!res.ok) {
        throw new Error(`Server error (${res.status}). Please check API environment.`);
      }
    }
    return data;
  };

  // 1. Send OTP
  const sendOtp = async (email) => {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await safeJsonResponse(res);
    if (!res.ok) throw new Error(data.error || "Failed to send OTP.");
    return data;
  };

  // 2. Verify OTP & Authenticate Session
  const verifyOtp = async (email, otp) => {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });
    const data = await safeJsonResponse(res);
    if (!res.ok) throw new Error(data.error || "OTP verification failed.");

    if (data.customToken) {
      try {
        await signInWithCustomToken(auth, data.customToken);
      } catch (authErr) {
        console.warn("[AuthProvider] signInWithCustomToken fallback:", authErr);
      }
    }

    if (!auth.currentUser) {
      const fallbackUser = {
        uid: data.uid,
        email: data.email,
        displayName: emailToName(data.email),
        isNewUser: data.isNewUser
      };
      setUser(fallbackUser);
      localStorage.setItem("tuka_user", JSON.stringify(fallbackUser));
      syncGuestOrders(fallbackUser);
    }

    return data;
  };

  // 3. Login with Email + Password
  const loginWithPassword = async (email, password) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return userCred.user;
    } catch (err) {
      // Fallback for custom user collection query if legacy credentials used
      const q = query(collection(db, "users"), where("email", "==", email.trim().toLowerCase()), where("password", "==", password));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const uData = { uid: snap.docs[0].id, ...snap.docs[0].data() };
        setUser(uData);
        localStorage.setItem("tuka_user", JSON.stringify(uData));
        syncGuestOrders(uData);
        return uData;
      }
      throw new Error(formatAuthError(err));
    }
  };

  // 4. Login with Google
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const gUser = result.user;
      
      const userRef = doc(db, "users", gUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: gUser.uid,
          email: gUser.email,
          displayName: gUser.displayName,
          photoURL: gUser.photoURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          authProvider: "google",
          emailVerified: true
        });
      }

      return gUser;
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  };

  // 5. Create or Update Password
  const setAccountPassword = async (newPassword) => {
    if (auth.currentUser) {
      await firebaseUpdatePassword(auth.currentUser, newPassword);
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        hasPassword: true,
        updatedAt: serverTimestamp()
      });
    } else if (user?.uid) {
      const res = await fetch("/api/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set password.");
    }
  };

  // 6. Sign Out
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("SignOut error:", e);
    } finally {
      setUser(null);
      localStorage.removeItem("tuka_user");
    }
  };

  // 7. Delete Account
  const deleteAccount = async () => {
    if (!user?.uid) return;
    try {
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "users", user.uid));
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
      await logout();
      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };

  const formatAuthError = (err) => {
    const msg = err.message || "";
    if (msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password") || msg.includes("auth/invalid-credential")) {
      return "Invalid email or password.";
    }
    if (msg.includes("auth/email-already-in-use")) {
      return "An account with this email already exists.";
    }
    if (msg.includes("auth/too-many-requests")) {
      return "Too many failed attempts. Please try again later.";
    }
    return msg.replace("Firebase: ", "").replace(/Error \(auth\/[^)]+\)\.?/, "").trim() || "Authentication failed.";
  };

  const value = { 
    user, 
    loading, 
    sendOtp,
    verifyOtp,
    loginWithPassword, 
    loginWithGoogle,
    setAccountPassword,
    logout, 
    deleteAccount, 
    syncGuestOrders,
    login: loginWithPassword,
    signup: async (email, password, displayName) => {
      // Legacy signup helper
      const res = await sendOtp(email);
      return res;
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
