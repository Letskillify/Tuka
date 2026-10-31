import { trackOrderShipment } from "../_lib/ithinkLogistics.js";
import { clientDb, doc, getDoc, collection, query, where, getDocs } from "../_lib/firebaseServer.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queryParams = req.query || {};
    const bodyParams = req.body || {};

    let awb = queryParams.awb || queryParams.waybill || bodyParams.awb || bodyParams.waybill || "";
    const orderNumber = queryParams.orderNumber || queryParams.ref_ids || bodyParams.orderNumber || bodyParams.ref_ids || "";
    const orderId = queryParams.orderId || bodyParams.orderId || "";

    // If no direct AWB provided, look up Firestore order by orderNumber or orderId
    if (!awb && (orderNumber || orderId)) {
      try {
        const db = clientDb;
        if (orderId) {
          const orderSnap = await getDoc(doc(db, "orders", orderId));
          if (orderSnap.exists()) {
            const data = orderSnap.data();
            awb = data.awbCode || data.trackingNumber || data.ithinkShipment?.waybill || "";
          }
        }
        if (!awb && orderNumber) {
          const q = query(collection(db, "orders"), where("orderNumber", "==", orderNumber.trim().toUpperCase()));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data();
            awb = data.awbCode || data.trackingNumber || data.ithinkShipment?.waybill || "";
          }
        }
      } catch (dbErr) {
        console.warn("[iThinkTrack] Firestore order lookup fallback warned:", dbErr.message);
      }
    }

    if (!awb) {
      return res.status(200).json({
        success: false,
        isPending: true,
        orderNumber: orderNumber || orderId || "N/A",
        currentStatus: "Order Confirmed & Processing",
        message: "Shipment is being prepared by our studio. AWB tracking code will update shortly.",
        scans: [
          {
            status: "Order Confirmed",
            statusCode: "CONFIRMED",
            location: "House of Tuka Weaving Hub (West Bengal)",
            dateTime: new Date().toISOString(),
            remark: "Customer acquisition received & verified"
          }
        ]
      });
    }

    const trackingResult = await trackOrderShipment(awb);

    if (trackingResult.success) {
      return res.status(200).json({
        success: true,
        ...trackingResult
      });
    }

    // AWB assigned but not yet scanned in iThink network
    return res.status(200).json({
      success: true,
      awb,
      orderNumber: orderNumber || "",
      currentStatus: "Manifest Generated",
      statusCode: "MANIFESTED",
      courier: "iThink Logistics Partner",
      trackingUrl: `https://ithinklogistics.trackshipment.in/${awb}`,
      message: trackingResult.error || "Shipment manifest generated. Real-time courier scans will reflect once picked up.",
      scans: [
        {
          status: "Manifest Generated",
          statusCode: "MANIFESTED",
          location: "Bengal Handloom Hub, Hooghly (700001)",
          dateTime: new Date().toISOString(),
          remark: "Package label created & awaiting courier pickup"
        }
      ]
    });
  } catch (err) {
    console.error("[iThinkTrackEndpoint] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch tracking data." });
  }
}
