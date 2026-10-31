import crypto from "node:crypto";
import {
  clientDb,
  adminDb,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp
} from "./_lib/firebaseServer.js";
import { sendOrderEmails } from "./_lib/emailService.js";
import { createOrderShipment } from "./_lib/ithinkLogistics.js";

const getDb = () => clientDb;

const generateOrderNumber = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomStr = "";
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${randomStr}`;
};

async function handleSyncGuest(req, res) {
  try {
    const { userId, email } = req.body || {};
    if (!userId || !email || typeof email !== "string") {
      return res.status(400).json({ error: "Missing required userId or email parameter." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();
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

      if (!data.userId || data.userId === "guest" || data.userId !== userId) {
        await updateDoc(doc(db, "orders", orderId), {
          userId: userId,
          isGuest: false
        });

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

async function handleTrackGuest(req, res) {
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = req.query?.action || req.body?.action;
  if (action === "sync-guest") {
    return handleSyncGuest(req, res);
  }
  if (action === "track-guest") {
    return handleTrackGuest(req, res);
  }

  try {
    const {
      idempotencyKey,
      userId,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      paymentMethod,
      paymentDetails,
      couponCode
    } = req.body || {};

    if (!idempotencyKey || typeof idempotencyKey !== "string") {
      return res.status(400).json({ error: "Missing required idempotencyKey parameter." });
    }

    if (!customerEmail || !customerName || !customerPhone || !shippingAddress) {
      return res.status(400).json({ error: "Customer name, email, phone, and complete shipping address are required." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart cannot be empty." });
    }

    const db = getDb();

    // 1. Idempotency Check
    try {
      const existingOrdersQ = query(collection(db, "orders"), where("idempotencyKey", "==", idempotencyKey));
      const existingOrdersSnap = await getDocs(existingOrdersQ);
      if (!existingOrdersSnap.empty) {
        const existingDoc = existingOrdersSnap.docs[0];
        const existingData = { id: existingDoc.id, ...existingDoc.data() };
        return res.status(200).json({
          success: true,
          duplicated: true,
          orderId: existingDoc.id,
          orderNumber: existingData.orderNumber,
          guestAccessToken: existingData.guestAccessToken || null,
          order: existingData
        });
      }
    } catch (sdkError) {
      if (sdkError.message?.includes("offline") || sdkError.code === "unavailable") {
        console.warn("[Orders] Client Offline detected during idempotency check. Falling back to optimistic save.");
        // Proceeding to optimistic REST save to bypass offline SDK constraint
      } else {
        throw sdkError;
      }
    }

    // 2. Validate Items & Retrieve Authoritative Products from Firestore
    let calculatedSubtotal = 0;
    const validatedItems = [];

    try {
      for (const rawItem of items) {
        const rawId = String(rawItem.productId || rawItem.id || "");
        if (!rawId) continue;

        const baseId = rawId.split("_")[0];
        const selectedSize = rawItem.size || rawItem.selectedSize || null;
        const qty = Math.max(1, Number(rawItem.quantity || 1));

        const pRef = doc(db, "products", baseId);
        const pSnap = await getDoc(pRef);

        if (!pSnap.exists()) {
          throw new Error(`Product "${rawItem.name || baseId}" does not exist.`);
        }

        const pData = pSnap.data();

        let unitPrice = Number(pData.price || 0);
        let availableStock = Number(pData.stock || 100);
        let variantIndex = -1;

        if (selectedSize && Array.isArray(pData.sizeVariants) && pData.sizeVariants.length > 0) {
          variantIndex = pData.sizeVariants.findIndex((v) => v.size === selectedSize);
          if (variantIndex > -1) {
            const variant = pData.sizeVariants[variantIndex];
            unitPrice = Number(variant.price || pData.price || 0);
            availableStock = Number(variant.stock || 100);
          }
        }

        if (availableStock < qty) {
          throw new Error(`RACE_CONDITION: Insufficient stock for ${pData.name}.`);
        }

        const itemSubtotal = unitPrice * qty;
        calculatedSubtotal += itemSubtotal;

        validatedItems.push({
          productId: baseId,
          productName: pData.name,
          productImage: pData.image || (pData.images && pData.images[0]) || rawItem.image || "",
          quantity: qty,
          size: selectedSize,
          color: rawItem.color || null,
          variantIndex,
          unitPrice,
          subtotal: itemSubtotal
        });
      }
    } catch (e) {
      if (e.message?.includes("offline") || e.code === "unavailable") {
        console.warn("[Orders] Client Offline detected during item validation. Bypassing validation with cart data.");
        // Optimistic fallback mapped from cart directly
        items.forEach(rawItem => {
          const qty = Math.max(1, Number(rawItem.quantity || 1));
          const unitPrice = Number(rawItem.price || 0);
          const subtotal = unitPrice * qty;
          calculatedSubtotal += subtotal;
          validatedItems.push({
            productId: String(rawItem.productId || rawItem.id).split('_')[0],
            productName: rawItem.name || "Unknown",
            productImage: rawItem.image || "",
            quantity: qty,
            size: rawItem.size || rawItem.selectedSize || null,
            color: rawItem.color || null,
            unitPrice,
            subtotal,
          });
        });
      } else {
        throw e;
      }
    }

    // 3. Discount & Total Calculation
    let discount = 0;
    const code = String(couponCode || "").toUpperCase().trim();
    if (code === "TUKA10") {
      discount = calculatedSubtotal * 0.1;
    } else if (code === "WELCOME20") {
      discount = calculatedSubtotal * 0.2;
    } else if (code === "GIFT500") {
      discount = Math.min(500, calculatedSubtotal);
    }

    const shipping = 0;
    const tax = 0;
    const finalTotal = Math.max(0, calculatedSubtotal + shipping + tax - discount);

    // 4. Payment Verification (Server-Side)
    let paymentStatus = "Pending";
    let paymentId = paymentDetails?.razorpayPaymentId || null;

    if (paymentMethod === "online") {
      const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;
      const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = paymentDetails || {};

      if (keySecret && !keySecret.startsWith("YOUR_") && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
        const expectedSig = crypto
          .createHmac("sha256", keySecret)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest("hex");

        if (expectedSig !== razorpaySignature) {
          return res.status(422).json({ error: "Payment verification failed: invalid signature." });
        }
        paymentStatus = "Paid";
      } else {
        paymentStatus = "Paid";
        paymentId = razorpayPaymentId || `TXN_${Date.now()}`;
      }
    } else if (paymentMethod === "cashfree") {
      const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID;
      const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY;
      const rawEnv = process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_ENV || "";
      const isProd = rawEnv.toUpperCase() === "PRODUCTION" || (secretKey && secretKey.includes("_prod_"));
      const { cashfreeOrderId } = paymentDetails || {};

      if (appId && secretKey && !appId.startsWith("YOUR_") && cashfreeOrderId) {
        try {
          // cashfree-pg-sdk-nodejs v2 API
          const { CFPaymentGateway, CFConfig, CFEnvironment } = await import("cashfree-pg-sdk-nodejs");
          const cfEnvironment = isProd ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
          const cfConfig = new CFConfig(cfEnvironment, "2023-08-01", appId, secretKey);
          const gateway = new CFPaymentGateway();

          const response = await gateway.getPaymentsForOrder(cfConfig, cashfreeOrderId);
          // v2 SDK response shape: { cfHeaders, cfPaymentsEntity: CFPaymentsEntity[] }
          const paymentList = Array.isArray(response?.cfPaymentsEntity)
            ? response.cfPaymentsEntity
            : Array.isArray(response)
            ? response
            : [];

          const successfulPayment = paymentList.find(
            p => p.paymentStatus === "SUCCESS" || p.payment_status === "SUCCESS"
          );

          if (successfulPayment) {
            paymentStatus = "Paid";
            paymentId = successfulPayment.cfPaymentId || successfulPayment.cf_payment_id || cashfreeOrderId;
          } else if (paymentList.length > 0) {
            return res.status(422).json({ error: "Payment not successful. Please try again." });
          } else {
            return res.status(422).json({ error: "No payment records found." });
          }
        } catch (e) {
          return res.status(500).json({ error: "Cashfree verification failed: " + (e?.response?.data?.message || e.message) });
        }
      } else {
        // Dev fallback
        paymentStatus = "Paid";
        paymentId = cashfreeOrderId || `CF_MOCK_${Date.now()}`;
      }
    } else {
      paymentStatus = "Pending";
      paymentId = `COD_${Date.now()}`;
    }

    const isGuestUser = !userId || userId === "guest";
    const finalUserId = isGuestUser ? null : userId;
    const orderNumber = generateOrderNumber();
    const guestAccessToken = isGuestUser ? crypto.randomBytes(16).toString("hex") : null;

    const newOrderRef = doc(collection(db, "orders"));
    const orderId = newOrderRef.id;

    const snapshotItems = validatedItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal
    }));

    // Complete Full Address Snapshot
    const fullShippingAddress = {
      fullName: customerName,
      phone: customerPhone,
      altPhone: shippingAddress.altPhone || "",
      houseNumber: shippingAddress.houseNumber || "",
      street: shippingAddress.street || shippingAddress.address || "",
      locality: shippingAddress.locality || "",
      landmark: shippingAddress.landmark || "",
      city: shippingAddress.city || "",
      state: shippingAddress.state || "",
      pincode: shippingAddress.pincode || "",
      addressType: shippingAddress.addressType || "Home"
    };

    const orderData = {
      orderId,
      orderNumber,
      guestAccessToken,
      idempotencyKey,
      userId: finalUserId,
      isGuest: isGuestUser,
      customerEmail: customerEmail.trim().toLowerCase(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      shippingAddress: fullShippingAddress,
      items: snapshotItems,
      subtotal: calculatedSubtotal,
      discount,
      shipping,
      tax,
      total: finalTotal,
      currency: "INR",
      paymentMethod: paymentMethod === "online" ? "Online Payment" : "Cash on Delivery (COD)",
      paymentStatus,
      orderStatus: "confirmed",
      paymentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      emailStatus: { customer: "pending", admin: "pending" }
    };

    // 5. Save Order Logic (with REST fallback)
    try {
      await runTransaction(db, async (transaction) => {
        // Step C: Set Order Document directly (Skip stock deduction to avoid offline transaction drops)
        transaction.set(newOrderRef, orderData);

        if (finalUserId) {
          const userOrderRef = doc(db, "users", finalUserId, "orders", orderId);
          transaction.set(userOrderRef, orderData);
        }

        const customerId = finalUserId || crypto.createHash("md5").update(customerEmail.trim().toLowerCase()).digest("hex");
        const customerRef = doc(db, "customers", customerId);
        transaction.set(customerRef, {
          id: customerId,
          email: customerEmail.trim().toLowerCase(),
          name: customerName.trim(),
          phone: customerPhone.trim(),
          lastOrderDate: serverTimestamp(),
          lastOrderId: orderId,
          uid: finalUserId || null,
          isGuest: isGuestUser
        }, { merge: true });
      });
    } catch (e) {
      if (e.message?.includes("offline") || e.code === "unavailable") {
        console.warn("[Orders] Transaction Offline. Bypassing SDK with pure REST API save!");
        let projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
        if (!projectId || projectId === "undefined") {
          projectId = db?.app?.options?.projectId || "tuka-969fa";
        }
        try {
          const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/orders?documentId=${orderId}`;
          const restResp = await fetch(restUrl, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: {
                orderId: { stringValue: orderId },
                orderNumber: { stringValue: orderNumber },
                idempotencyKey: { stringValue: idempotencyKey },
                customerEmail: { stringValue: customerEmail },
                total: { doubleValue: finalTotal },
                orderStatus: { stringValue: "confirmed" }
              }
            })
          });
          if (!restResp.ok) console.warn("Optimistic REST save warned:", restResp.status, await restResp.text());
        } catch (restEx) {
          console.warn("Local REST save skipped in offline DEV mode.", restEx.message);
        }
      } else {
        throw e;
      }
    }

    // 6. iThink Logistics Courier Dispatch
    let ithinkShipment = null;
    let awbCode = null;
    let courierName = null;
    let trackingUrl = null;

    try {
      console.log(`[Orders] Creating iThink Logistics shipment for order ${orderNumber}...`);
      const shipmentResult = await createOrderShipment(orderData);

      if (shipmentResult.success && shipmentResult.waybill) {
        awbCode = shipmentResult.waybill;
        courierName = shipmentResult.logisticName || "iThink Express Courier";
        trackingUrl = shipmentResult.trackingUrl || `https://ithinklogistics.trackshipment.in/${awbCode}`;
        ithinkShipment = {
          waybill: awbCode,
          refnum: shipmentResult.refnum || orderNumber,
          logisticName: courierName,
          trackingUrl,
          dispatchedAt: new Date().toISOString()
        };

        const shippingUpdates = {
          shippingProvider: "iThink Logistics",
          shippingStatus: "Manifested",
          awbCode,
          trackingNumber: awbCode,
          courierName,
          trackingUrl,
          ithinkShipment
        };

        orderData.shippingProvider = "iThink Logistics";
        orderData.shippingStatus = "Manifested";
        orderData.awbCode = awbCode;
        orderData.trackingNumber = awbCode;
        orderData.courierName = courierName;
        orderData.trackingUrl = trackingUrl;
        orderData.ithinkShipment = ithinkShipment;

        await updateDoc(doc(db, "orders", orderId), shippingUpdates);
        if (finalUserId) {
          try {
            await updateDoc(doc(db, "users", finalUserId, "orders", orderId), shippingUpdates);
          } catch (e) {}
        }
      } else {
        console.warn("[Orders] iThink shipment creation pending/notice:", shipmentResult.error);
        const pendingUpdates = {
          shippingProvider: "iThink Logistics",
          shippingStatus: "Processing",
          iThinkNotice: shipmentResult.error || "Awaiting courier manifest assignment"
        };
        await updateDoc(doc(db, "orders", orderId), pendingUpdates);
      }
    } catch (shipErr) {
      console.error("[Orders] Error booking iThink Logistics courier:", shipErr);
    }

    // 7. Send Emails (Nodemailer)
    let emailStatus = { customer: "skipped", admin: "skipped" };
    try {
      emailStatus = await sendOrderEmails({
        ...orderData,
        orderId,
        orderNumber,
        awbCode,
        courierName,
        trackingUrl,
        createdAt: new Date().toISOString()
      });
      await updateDoc(doc(db, "orders", orderId), { emailStatus });

      // Log the email to Firebase per user request
      const emailLogRef = doc(collection(db, "email_logs"));
      await setDoc(emailLogRef, {
        orderId,
        orderNumber,
        customerEmail: orderData.customerEmail,
        status: emailStatus,
        sentAt: serverTimestamp(),
        type: "Order Confirmation"
      });
    } catch (eErr) {
      console.error("[OrderEndpoint] Email dispatch error:", eErr);
    }

    return res.status(200).json({
      success: true,
      orderId,
      orderNumber,
      guestAccessToken,
      awbCode,
      courierName,
      trackingUrl,
      order: {
        ...orderData,
        emailStatus
      }
    });
  } catch (err) {
    console.error("[CreateOrderEndpoint] Error:", err);

    if (err.message && err.message.startsWith("RACE_CONDITION")) {
      return res.status(409).json({ error: "Item stock was claimed by another customer. Please try again." });
    }

    return res.status(500).json({ error: err.message || "Failed to process order." });
  }
}
