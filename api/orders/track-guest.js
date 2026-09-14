import { 
  clientDb, 
  adminDb, 
  collection, 
  query, 
  where, 
  getDocs 
} from "../_lib/firebaseServer.js";

const getDb = () => adminDb || clientDb;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderNumber, accessToken } = req.body || {};

    if (!orderNumber || typeof orderNumber !== "string" || !accessToken || typeof accessToken !== "string") {
      return res.status(400).json({ error: "Order number and secure access token are required for guest tracking." });
    }

    const db = getDb();
    const q = query(
      collection(db, "orders"),
      where("orderNumber", "==", orderNumber.trim().toUpperCase()),
      where("guestAccessToken", "==", accessToken.trim())
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      return res.status(404).json({ error: "Order not found or invalid security credentials." });
    }

    const docSnap = snap.docs[0];
    const data = docSnap.data();

    // Sanitized snapshot for guest tracking
    return res.status(200).json({
      success: true,
      order: {
        orderId: docSnap.id,
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        shippingAddress: data.shippingAddress,
        items: data.items,
        subtotal: data.subtotal,
        discount: data.discount,
        shipping: data.shipping,
        tax: data.tax,
        total: data.total,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        orderStatus: data.orderStatus,
        createdAt: data.createdAt
      }
    });
  } catch (err) {
    console.error("[TrackGuestOrder] Error:", err);
    return res.status(500).json({ error: "Failed to retrieve order details." });
  }
}
