import crypto from "node:crypto";
import {
  clientDb,
  adminDb,
  adminAuth,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "./_lib/firebaseServer.js";

const getDb = () => clientDb;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email: rawEmail, otp } = req.body || {};

    if (!rawEmail || typeof rawEmail !== "string") {
      return res.status(400).json({ error: "Email address is required." });
    }

    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
      return res.status(400).json({ error: "Verification code must be a 6-digit number." });
    }

    const email = rawEmail.trim().toLowerCase();
    const db = getDb();
    const otpRef = doc(db, "otps", email);
    const otpSnap = await getDoc(otpRef);

    if (!otpSnap.exists()) {
      return res.status(400).json({ error: "No active verification code found for this email. Please request a new code." });
    }

    const otpData = otpSnap.data();

    if (otpData.used) {
      return res.status(400).json({ error: "This verification code has already been used. Please request a new code." });
    }

    // Check expiration (10 minutes)
    if (new Date(otpData.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new code." });
    }

    // Check max attempt limit (5 attempts)
    if ((otpData.attempts || 0) >= 5) {
      await updateDoc(otpRef, { used: true });
      return res.status(429).json({ error: "Maximum verification attempts exceeded. Please request a new verification code." });
    }

    // Validate SHA-256 OTP Hash
    const submittedHash = crypto.createHash("sha256").update(otp.trim()).digest("hex");
    if (submittedHash !== otpData.otpHash) {
      const newAttempts = (otpData.attempts || 0) + 1;
      await updateDoc(otpRef, { attempts: newAttempts });

      if (newAttempts >= 5) {
        await updateDoc(otpRef, { used: true });
        return res.status(429).json({ error: "Maximum verification attempts exceeded. Please request a new verification code." });
      }

      return res.status(400).json({
        error: `Incorrect verification code. ${5 - newAttempts} attempt(s) remaining.`
      });
    }

    // Mark OTP as used immediately to prevent replay
    await updateDoc(otpRef, { used: true });

    // Handle Firebase User Account (Existing vs New User)
    let uid = null;
    let isNewUser = false;
    let customToken = null;
    let userHasPassword = false;

    if (adminAuth) {
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        uid = userRecord.uid;
        userHasPassword = Boolean(userRecord.passwordHash);

        // Update Firestore profile
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid,
            email,
            displayName: userRecord.displayName || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            authProvider: "otp",
            emailVerified: true
          });
        } else {
          await updateDoc(userRef, { updatedAt: serverTimestamp() });
        }
      } catch (err) {
        if (err.code === "auth/user-not-found") {
          // New User Creation
          isNewUser = true;
          const newUser = await adminAuth.createUser({
            email,
            emailVerified: true,
            displayName: email.split("@")[0]
          });
          uid = newUser.uid;

          // Create Firestore User Document
          await setDoc(doc(db, "users", uid), {
            uid,
            email,
            displayName: newUser.displayName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            authProvider: "otp",
            emailVerified: true
          });
        } else {
          throw err;
        }
      }

      // Mint Firebase Custom Auth Token
      customToken = await adminAuth.createCustomToken(uid);
    } else {
      // Fallback for Client SDK Firestore User Doc lookup
      const usersQ = query(collection(db, "users"), where("email", "==", email));
      const usersSnap = await getDocs(usersQ);

      if (!usersSnap.empty) {
        uid = usersSnap.docs[0].id;
        userHasPassword = Boolean(usersSnap.docs[0].data().password);
      } else {
        isNewUser = true;
        const newDocRef = doc(collection(db, "users"));
        uid = newDocRef.id;
        await setDoc(newDocRef, {
          uid,
          email,
          displayName: email.split("@")[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authProvider: "otp",
          emailVerified: true
        });
      }
    }

    // Automatically trigger guest order sync for this verified email
    try {
      const guestQ = query(collection(db, "orders"), where("isGuest", "==", true), where("customerEmail", "==", email));
      const guestSnap = await getDocs(guestQ);
      if (!guestSnap.empty) {
        for (const orderDoc of guestSnap.docs) {
          await updateDoc(doc(db, "orders", orderDoc.id), { userId: uid, isGuest: false });
        }
      }
    } catch (gErr) {
      console.warn("[VerifyOTP] Guest order sync warning:", gErr);
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      uid,
      email,
      isNewUser,
      hasPassword: userHasPassword,
      customToken
    });
  } catch (err) {
    console.error("[VerifyOTP] Error:", err);
    return res.status(500).json({ error: err.message || "OTP verification failed. Please try again." });
  }
}
