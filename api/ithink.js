import {
  checkRateAndServiceability,
  createOrderShipment,
  getShippingLabel,
  trackOrderShipment
} from "./_lib/ithinkLogistics.js";
import { clientDb, doc, getDoc, updateDoc, collection, query, where, getDocs } from "./_lib/firebaseServer.js";

export default async function handler(req, res) {
  // Extract action from query parameter or URL pathname
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
      const rawInput = String(
        queryParams.awb ||
        queryParams.waybill ||
        queryParams.orderNumber ||
        queryParams.ref_ids ||
        bodyParams.awb ||
        bodyParams.waybill ||
        bodyParams.orderNumber ||
        bodyParams.ref_ids ||
        ""
      ).trim();

      const orderId = queryParams.orderId || bodyParams.orderId || "";

      let resolvedAwb = "";
      let orderNumber = rawInput;
      let matchedOrder = null;

      // Smart Order & AWB Resolver from Firestore
      if (rawInput || orderId) {
        try {
          const db = clientDb;
          if (orderId) {
            const orderSnap = await getDoc(doc(db, "orders", orderId));
            if (orderSnap.exists()) {
              matchedOrder = orderSnap.data();
              resolvedAwb = matchedOrder.awbCode || matchedOrder.trackingNumber || matchedOrder.ithinkShipment?.waybill || "";
              orderNumber = matchedOrder.orderNumber || orderId;
            }
          }

          if (!matchedOrder && rawInput) {
            // Check by human-readable order number (e.g. ORD-X2FENT)
            const numQ = query(collection(db, "orders"), where("orderNumber", "==", rawInput.toUpperCase()));
            const numSnap = await getDocs(numQ);
            if (!numSnap.empty) {
              matchedOrder = numSnap.docs[0].data();
              resolvedAwb = matchedOrder.awbCode || matchedOrder.trackingNumber || matchedOrder.ithinkShipment?.waybill || "";
              orderNumber = matchedOrder.orderNumber || rawInput;
            } else {
              // Check by direct doc ID
              const docSnap = await getDoc(doc(db, "orders", rawInput));
              if (docSnap.exists()) {
                matchedOrder = docSnap.data();
                resolvedAwb = matchedOrder.awbCode || matchedOrder.trackingNumber || matchedOrder.ithinkShipment?.waybill || "";
                orderNumber = matchedOrder.orderNumber || rawInput;
              } else {
                // If not found as orderNumber or docId, rawInput is directly an AWB/Waybill
                resolvedAwb = rawInput;
              }
            }
          }
        } catch (dbErr) {
          console.warn("[iThinkTrack] Firestore resolution notice:", dbErr.message);
          resolvedAwb = rawInput;
        }
      }

      // If matched order has NO AWB yet (e.g. still in packing / wallet pending)
      if (matchedOrder && !resolvedAwb) {
        const orderStatusNorm = String(matchedOrder.orderStatus || matchedOrder.status || "confirmed").toLowerCase();
        let displayStatus = "Order Confirmed & Studio Processing";
        let remark = "Package is being prepared by our studio. Courier manifest will be assigned upon dispatch.";

        if (orderStatusNorm.includes("pack")) {
          displayStatus = "Packed & Ready for Courier Handover";
          remark = "Item packed and verified at boutique atelier. Awaiting courier partner pickup.";
        } else if (orderStatusNorm.includes("cancel")) {
          displayStatus = "Order Cancelled";
          remark = "This order was cancelled.";
        }

        const noticeMsg = matchedOrder.iThinkNotice || matchedOrder.iThinkError;

        return res.status(200).json({
          success: true,
          isPending: true,
          orderNumber: orderNumber || "N/A",
          awb: null,
          courier: "iThink Logistics Partner",
          currentStatus: displayStatus,
          message: noticeMsg || remark,
          trackingUrl: "https://www.ithinklogistics.com/track-order",
          scans: [
            {
              status: displayStatus,
              statusCode: orderStatusNorm.toUpperCase(),
              location: "2KA BOUTIQUE, Shop No 82, Poonam Parkview, Yazoo Park, Global City, Virar West, PIN 401303",
              dateTime: matchedOrder.createdAt?.seconds
                ? new Date(matchedOrder.createdAt.seconds * 1000).toISOString()
                : new Date().toISOString(),
              remark: noticeMsg ? `Studio Notice: ${noticeMsg}` : remark
            }
          ],
          ShipmentData: [
            {
              Shipment: {
                Status: {
                  Status: displayStatus,
                  StatusDateTime: new Date().toISOString()
                },
                AWB: "Pending Assignment",
                ReferenceNo: orderNumber,
                Courier: "iThink Logistics",
                TrackingUrl: "https://www.ithinklogistics.com/track-order"
              }
            }
          ]
        });
      }

      if (!resolvedAwb) {
        return res.status(200).json({
          success: false,
          isPending: true,
          orderNumber: orderNumber || "N/A",
          currentStatus: "Order Received",
          message: "No shipment record found for this tracking code. Please verify your order number or AWB.",
          trackingUrl: "https://www.ithinklogistics.com/track-order",
          scans: []
        });
      }

      // Query iThink Logistics Live Tracking API with the real AWB
      const trackingResult = await trackOrderShipment(resolvedAwb);

      const currentStatus = trackingResult.success
        ? (trackingResult.currentStatus || "In Transit")
        : (matchedOrder?.shippingStatus || "Manifest Generated");

      const courier = trackingResult.courier || matchedOrder?.courierName || "iThink Logistics Partner";
      const trackingUrl = trackingResult.trackingUrl || `https://www.ithinklogistics.com/track-order?tracking_number=${encodeURIComponent(resolvedAwb)}`;

      return res.status(200).json({
        success: true,
        ...trackingResult,
        awb: resolvedAwb,
        orderNumber,
        courier,
        trackingUrl,
        currentStatus,
        expectedDeliveryDate: trackingResult.expectedDeliveryDate || null,
        scans: trackingResult.scans && trackingResult.scans.length > 0
          ? trackingResult.scans
          : [
              {
                status: currentStatus,
                statusCode: "MANIFESTED",
                location: "2KA BOUTIQUE, Shop No 82, Poonam Parkview, Yazoo Park, Global City, Virar West, PIN 401303",
                dateTime: new Date().toISOString(),
                remark: "Package label created & awaiting courier partner pickup"
              }
            ],
        ShipmentData: [
          {
            Shipment: {
              Status: {
                Status: currentStatus,
                StatusDateTime: new Date().toISOString()
              },
              AWB: resolvedAwb,
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
      const {
        orderId,
        order: directOrder,
        packageWeight,
        packageLength,
        packageWidth,
        packageHeight
      } = bodyParams;
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

      if (packageWeight) orderData.packageWeight = packageWeight;
      if (packageLength) orderData.packageLength = packageLength;
      if (packageWidth) orderData.packageWidth = packageWidth;
      if (packageHeight) orderData.packageHeight = packageHeight;

      const result = await createOrderShipment(orderData);

      if (targetDocId) {
        try {
          const updatePayload = {
            shippingProvider: "iThink Logistics",
            packageWeight: orderData.packageWeight || null,
            packageLength: orderData.packageLength || null,
            packageWidth: orderData.packageWidth || null,
            packageHeight: orderData.packageHeight || null,
            orderStatus: "packed",
            status: "Packed",
            updatedAt: new Date().toISOString()
          };

          if (result.success && result.waybill) {
            updatePayload.awbCode = result.waybill;
            updatePayload.trackingNumber = result.waybill;
            updatePayload.courierName = result.logisticName || "iThink Express Courier";
            updatePayload.trackingUrl = result.trackingUrl;
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

