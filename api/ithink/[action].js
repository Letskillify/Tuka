import {
  checkRateAndServiceability,
  createOrderShipment,
  getShippingLabel,
  trackOrderShipment
} from "../_lib/ithinkLogistics.js";
import { clientDb, doc, getDoc, updateDoc, collection, query, where, getDocs } from "../_lib/firebaseServer.js";

export default async function handler(req, res) {
  // Extract action from query (Vercel file-system routing) or pathname fallback
  let action = req.query.action;
  if (!action && req.url) {
    const cleanUrl = req.url.split("?")[0].replace(/\/$/, "");
    action = cleanUrl.split("/").pop();
  }

  const queryParams = req.query || {};
  const bodyParams = req.body || {};

  // 1. CHECK PINCODE / SERVICEABILITY
  if (action === "check-pincode") {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const pincode = queryParams.pincode || bodyParams.pincode;
      const paymentMethod = queryParams.paymentMethod || bodyParams.paymentMethod || "prepaid";
      const weight = queryParams.weight || bodyParams.weight || 0.5;
      const orderTotal = queryParams.orderTotal || bodyParams.orderTotal || 2000;

      if (!pincode) {
        return res.status(400).json({ error: "Pincode is required." });
      }

      const result = await checkRateAndServiceability({
        pincode,
        paymentMethod,
        weight,
        orderTotal
      });

      return res.status(200).json({
        ...result,
        is_serviceable: result.isServiceable,
        // Legacy Delhivery compatibility payload
        delivery_codes: [
          {
            postal_code: {
              pin: pincode,
              pre_paid: "Y",
              cash: "Y",
              pickup: "Y",
              cod: "Y"
            }
          }
        ],
        expected_delivery_date: result.expectedDays,
        minEdd: result.minEdd,
        maxEdd: result.maxEdd,
        couriers: result.couriers || []
      });
    } catch (err) {
      console.error("[iThinkPincode] Error:", err);
      return res.status(200).json({
        is_serviceable: true,
        delivery_codes: [{ postal_code: { pin: req.query?.pincode, pre_paid: "Y", cod: "Y" } }]
      });
    }
  }

  // 2. TRACK SHIPMENT / AWB
  if (action === "track" || action === "track-shipment") {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      let awb = queryParams.awb || queryParams.waybill || bodyParams.awb || bodyParams.waybill || "";
      const orderNumber = queryParams.orderNumber || queryParams.ref_ids || bodyParams.orderNumber || bodyParams.ref_ids || "";
      const orderId = queryParams.orderId || bodyParams.orderId || "";

      // Fallback search in Firestore
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
          console.warn("[iThinkTrack] Firestore fallback warned:", dbErr.message);
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
              remark: "Customer order confirmed & verified"
            }
          ]
        });
      }

      const trackingResult = await trackOrderShipment(awb);

      const currentStatus = trackingResult.success ? (trackingResult.currentStatus || "In Transit") : "Manifest Generated";
      const courier = trackingResult.courier || "iThink Logistics Partner";
      const trackingUrl = trackingResult.trackingUrl || `https://ithinklogistics.trackshipment.in/${awb}`;

      return res.status(200).json({
        success: true,
        ...trackingResult,
        awb,
        courier,
        trackingUrl,
        currentStatus,
        expectedDeliveryDate: trackingResult.expectedDeliveryDate || null,
        scans: trackingResult.scans || [
          {
            status: "Manifest Generated",
            statusCode: "MANIFESTED",
            location: "Bengal Handloom Hub, Hooghly (700001)",
            dateTime: new Date().toISOString(),
            remark: "Package label created & awaiting courier pickup"
          }
        ],
        // Legacy Delhivery compatibility payload
        ShipmentData: [
          {
            Shipment: {
              Status: {
                Status: currentStatus,
                StatusDateTime: new Date().toISOString()
              },
              AWB: awb,
              ReferenceNo: orderNumber,
              Courier: courier,
              TrackingUrl: trackingUrl,
              ExpectedDeliveryDate: trackingResult.expectedDeliveryDate || null,
              Scans: trackingResult.scans || []
            }
          }
        ]
      });
    } catch (err) {
      console.error("[iThinkTrack] Error:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch tracking data." });
    }
  }

  // 3. CREATE SHIPMENT
  if (action === "create-shipment") {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { orderId, order: directOrder } = bodyParams;
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

      const result = await createOrderShipment(orderData);

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
      console.error("[CreateShipment] Error:", err);
      return res.status(500).json({ error: err.message || "Failed to process shipment creation." });
    }
  }

  // 4. SHIPPING LABEL
  if (action === "shipping-label") {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const awb = queryParams.awb || queryParams.awb_numbers || bodyParams.awb || bodyParams.awb_numbers;
      const pageSize = queryParams.pageSize || bodyParams.pageSize || "A4";

      if (!awb) {
        return res.status(400).json({ error: "AWB number is required." });
      }

      const result = await getShippingLabel(awb, pageSize);
      return res.status(200).json(result);
    } catch (err) {
      console.error("[ShippingLabel] Error:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch shipping label." });
    }
  }

  return res.status(404).json({ error: `Unknown logistics action: ${action}` });
}
