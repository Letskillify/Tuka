import { trackOrderShipment } from "../_lib/ithinkLogistics.js";
import { clientDb, doc, getDoc, collection, query, where, getDocs } from "../_lib/firebaseServer.js";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let waybill = req.query.waybill || (req.body && req.body.waybill) || "";
    const ref_ids = req.query.ref_ids || (req.body && req.body.ref_ids) || "";

    if (!waybill && !ref_ids) {
      return res.status(400).json({ error: "Either waybill or order ID (ref_ids) is required." });
    }

    // If no direct waybill, check Firestore order
    if (!waybill && ref_ids) {
      try {
        const q = query(collection(clientDb, "orders"), where("orderNumber", "==", ref_ids.trim().toUpperCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const ord = snap.docs[0].data();
          waybill = ord.awbCode || ord.trackingNumber || "";
        }
      } catch (e) {}
    }

    const cleanAwb = waybill || ref_ids;
    const trackResult = await trackOrderShipment(cleanAwb);

    const currentStatus = trackResult.success ? (trackResult.currentStatus || "In Transit") : "Manifested / Ready for Courier";
    const courier = trackResult.courier || "iThink Express (Delhivery/Partner)";
    const trackingUrl = trackResult.trackingUrl || `https://ithinklogistics.trackshipment.in/${cleanAwb}`;

    // Return in Delhivery format for legacy components + new iThink fields
    return res.status(200).json({
      success: true,
      awb: cleanAwb,
      courier,
      trackingUrl,
      currentStatus,
      expectedDeliveryDate: trackResult.expectedDeliveryDate || null,
      scans: trackResult.scans || [],
      ShipmentData: [
        {
          Shipment: {
            Status: {
              Status: currentStatus,
              StatusDateTime: new Date().toISOString()
            },
            AWB: cleanAwb,
            ReferenceNo: ref_ids,
            Courier: courier,
            TrackingUrl: trackingUrl,
            ExpectedDeliveryDate: trackResult.expectedDeliveryDate || null,
            Scans: trackResult.scans || []
          }
        }
      ]
    });
  } catch (err) {
    console.error("[DelhiveryTrack] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to track shipment." });
  }
}
