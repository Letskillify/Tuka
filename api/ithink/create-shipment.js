import { createOrderShipment } from "../_lib/ithinkLogistics.js";
import { clientDb, doc, getDoc, updateDoc } from "../_lib/firebaseServer.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId, order: directOrder } = req.body || {};

    let orderData = directOrder;
    let targetDocId = orderId;

    if (!orderData && orderId) {
      const snap = await getDoc(doc(clientDb, "orders", orderId));
      if (!snap.exists()) {
        return res.status(404).json({ error: "Order not found." });
      }
      orderData = snap.data();
      targetDocId = snap.id;
    }

    if (!orderData) {
      return res.status(400).json({ error: "Order ID or order details are required." });
    }

    // Call iThink Logistics API
    const result = await createOrderShipment(orderData);

    // If order exists in database, update it with tracking and AWB information
    if (targetDocId) {
      try {
        const updatePayload = {
          shippingProvider: "iThink Logistics",
          updatedAt: new Date().toISOString()
        };

        if (result.success && result.waybill) {
          updatePayload.awbCode = result.waybill;
          updatePayload.trackingNumber = result.waybill;
          updatePayload.courierName = result.logisticName || "iThink Express Courier";
          updatePayload.trackingUrl = result.trackingUrl;
          updatePayload.orderStatus = "shipped";
          updatePayload.shippingStatus = "Manifested";
          updatePayload.ithinkShipment = {
            waybill: result.waybill,
            refnum: result.refnum,
            logisticName: result.logisticName,
            trackingUrl: result.trackingUrl,
            dispatchedAt: new Date().toISOString()
          };
        } else {
          updatePayload.iThinkError = result.error;
          updatePayload.shippingStatus = "Pending Courier Assignment";
        }

        await updateDoc(doc(clientDb, "orders", targetDocId), updatePayload);

        if (orderData.userId) {
          try {
            await updateDoc(doc(clientDb, "users", orderData.userId, "orders", targetDocId), updatePayload);
          } catch (e) {}
        }
      } catch (dbErr) {
        console.warn("[CreateShipment] Firestore update error:", dbErr.message);
      }
    }

    return res.status(200).json({
      success: result.success,
      ...result
    });
  } catch (err) {
    console.error("[CreateShipmentEndpoint] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to process shipment creation." });
  }
}
