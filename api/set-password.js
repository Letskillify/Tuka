import { 
  clientDb, 
  adminDb, 
  adminAuth, 
  doc, 
  updateDoc, 
  getDoc, 
  serverTimestamp 
} from "./_lib/firebaseServer.js";

const getDb = () => adminDb || clientDb;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { uid, password } = req.body || {};

    if (!uid || typeof uid !== "string") {
      return res.status(400).json({ error: "User ID is required." });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters in length." });
    }

    const db = getDb();

    if (adminAuth) {
      await adminAuth.updateUser(uid, { password });
    }

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        hasPassword: true,
        updatedAt: serverTimestamp()
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password set successfully."
    });
  } catch (err) {
    console.error("[SetPassword] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to set password." });
  }
}
