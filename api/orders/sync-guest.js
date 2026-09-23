import {
  clientDb,
  adminDb,
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from "../_lib/firebaseServer.js";

const getDb = () => clientDb;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, email } = req.body || {};

    if (!userId || !email || typeof email !== "string") {
      return res.status(400).json({ error: "Missing required userId or email parameter." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();

    // Query all orders placed with this email address
    const ordersQ = query(
      collection(db, "orders"),
      where("customerEmail", "==", cleanEmail)
    );

    const snap = await getDocs(ordersQ);

    if (snap.empty) {
      return res.status(200).json({ success: true, claimedCount: 0, message: "No matching guest orders found." });
    }

    let claimedCount = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const orderId = docSnap.id;

      // If order is unassigned or assigned to a guest, claim it for this user account
      if (!data.userId || data.userId === "guest" || data.userId !== userId) {
        // Update main order doc
        await updateDoc(doc(db, "orders", orderId), {
          userId: userId,
          isGuest: false
        });

        // Sync to user's subcollection users/{uid}/orders/{orderId}
        const userOrderRef = doc(db, "users", userId, "orders", orderId);
        await setDoc(userOrderRef, {
          ...data,
          userId: userId,
          isGuest: false
        }, { merge: true });

        claimedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      claimedCount,
      message: `Successfully synchronized ${claimedCount} order(s) to user account.`
    });
  } catch (err) {
    console.error("[SyncGuestOrders] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to sync guest orders." });
  }
}
