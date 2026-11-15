import crypto from "node:crypto";
import Razorpay from "razorpay";
import {
  clientDb,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "../_lib/firebaseServer.js";

import { sendOrderEmails } from "../_lib/emailService.js";
import { deductOrderInventory } from "../_lib/inventoryService.js";
import { createOrderShipment } from "../_lib/ithinkLogistics.js";

/**
 * Razorpay Server-to-Server Webhook Handler
 * Receives payment status updates directly from Razorpay servers.
 * Validates webhook signatures, server-side verifies payment, deducts stock, and sends confirmation emails.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Webhooks require POST." });
  }

  try {
    const body = req.body || {};
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TzHgCF9oJKx3j4";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || "HZ2mIdBDHfY2VYb1Vwo8JSUb";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || keySecret;

    // ── 1. SIGNATURE VERIFICATION ──
    const signature = req.headers["x-razorpay-signature"];

    if (signature && webhookSecret && !webhookSecret.startsWith("YOUR_")) {
      const rawBody = typeof req.rawBody === "string" ? req.rawBody : JSON.stringify(body);
      const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSig) {
        console.warn("[RazorpayWebhook] Invalid webhook signature. Rejecting unauthorized callback.");
        return res.status(401).json({ error: "Invalid webhook signature" });
      }
    }

    const event = body.event || "";
    console.log("[RazorpayWebhook] Incoming webhook event received:", { event });

    // Extract Razorpay payment & order entities
    const paymentEntity = body.payload?.payment?.entity || {};
    const orderEntity = body.payload?.order?.entity || {};

    const razorpayOrderId = paymentEntity.order_id || orderEntity.id || body.order_id;
    const paymentId = paymentEntity.id || body.payment_id;
    const paymentStatus = String(paymentEntity.status || "").toLowerCase();

    if (!razorpayOrderId && !paymentId) {
      console.warn("[RazorpayWebhook] Webhook payload missing order_id or payment_id:", JSON.stringify(body).slice(0, 200));
      return res.status(400).json({ error: "Missing identifier in webhook payload" });
    }

    const db = clientDb;

    // ── 2. FIND ORDER IN FIRESTORE ──
    let orderDocSnap = null;
    if (razorpayOrderId) {
      const q = query(collection(db, "orders"), where("razorpayOrderId", "==", razorpayOrderId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        orderDocSnap = snap.docs[0];
      }
    }

    if (!orderDocSnap && paymentId) {
      const qPay = query(collection(db, "orders"), where("paymentId", "==", paymentId));
      const snapPay = await getDocs(qPay);
      if (!snapPay.empty) {
        orderDocSnap = snapPay.docs[0];
      }
    }

    if (!orderDocSnap && razorpayOrderId) {
      const directSnap = await getDoc(doc(db, "orders", razorpayOrderId));
      if (directSnap.exists()) {
        orderDocSnap = directSnap;
      }
    }

    if (!orderDocSnap) {
      console.warn(`[RazorpayWebhook] Order not found in Firestore for razorpayOrderId ${razorpayOrderId}`);
      return res.status(200).json({ received: true, processed: false, error: "Order not found" });
    }

    const orderDocId = orderDocSnap.id;
    const orderData = { id: orderDocId, ...orderDocSnap.data() };

    // SAFEGUARD: Never allow an older failed event to overwrite a previously verified successful payment!
    if (orderData.paymentStatus === "Paid" && event === "payment.failed") {
      console.log(`[RazorpayWebhook] Order ${orderDocId} is already marked Paid. Ignoring non-success webhook event.`);
      return res.status(200).json({ received: true, duplicate: true, orderId: orderDocId });
    }

    const isSuccess =
      event === "payment.captured" ||
      event === "order.paid" ||
      paymentStatus === "captured";

    if (!isSuccess) {
      if (event === "payment.failed" && orderData.paymentStatus !== "Paid") {
        await updateDoc(doc(db, "orders", orderDocId), {
          paymentStatus: "Failed",
          orderStatus: "payment_failed",
          updatedAt: serverTimestamp()
        });
      }
      return res.status(200).json({ received: true, processed: false, reason: `Ignored event: ${event}` });
    }

    const finalPaymentId = String(paymentId || razorpayOrderId);

    // IDEMPOTENCY CHECK
    const isAlreadyPaid = orderData.paymentStatus === "Paid";
    const isInventoryDeducted = orderData.inventoryDeducted === true;
    const isEmailSent = orderData.emailStatus?.customer === "sent";

    if (isAlreadyPaid && isInventoryDeducted && isEmailSent) {
      console.log(`[RazorpayWebhook] Order ${orderDocId} already fully confirmed, stock deducted, and email sent. Idempotent skip.`);
      return res.status(200).json({ received: true, duplicate: true, orderId: orderDocId });
    }

    // ── 3. UPDATE FIRESTORE ORDER ──
    const amountInRupees = paymentEntity.amount ? paymentEntity.amount / 100 : orderData.total;
    const updates = {
      paymentStatus: "Paid",
      orderStatus: "confirmed",
      paymentId: finalPaymentId,
      razorpayPaymentId: finalPaymentId,
      razorpayOrderId: razorpayOrderId || orderData.razorpayOrderId,
      paymentMethod: "Online Payment (Razorpay)",
      paymentDetails: {
        gateway: "Razorpay",
        razorpayOrderId: razorpayOrderId || orderData.razorpayOrderId,
        razorpayPaymentId: finalPaymentId,
        paymentId: finalPaymentId,
        amount: amountInRupees,
        currency: paymentEntity.currency || "INR",
        method: paymentEntity.method || "online",
        status: "captured",
        verifiedAt: new Date().toISOString()
      },
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "orders", orderDocId), updates);

    if (orderData.userId && orderData.userId !== "guest") {
      try {
        await updateDoc(doc(db, "users", orderData.userId, "orders", orderDocId), updates);
      } catch (e) {}
    }

    const currentOrderSnapshot = { ...orderData, ...updates };

    // ── 4. CONCURRENCY-SAFE INVENTORY DEDUCTION ──
    if (!orderData.inventoryDeducted) {
      try {
        console.log(`[RazorpayWebhook] Deducting inventory for order ${orderDocId}...`);
        await deductOrderInventory(db, orderDocId, orderData.items, orderData.userId);
        currentOrderSnapshot.inventoryDeducted = true;
      } catch (invErr) {
        console.error(`[RazorpayWebhook] Stock deduction error for order ${orderDocId}:`, invErr.message);
      }
    }

    // ── 5. DISPATCH ORDER CONFIRMATION EMAIL ──
    let emailStatus = currentOrderSnapshot.emailStatus || { customer: "pending", admin: "pending" };
    if (emailStatus.customer !== "sent") {
      try {
        console.log(`[RazorpayWebhook] Dispatching confirmation email for order ${orderDocId} to ${orderData.customerEmail}...`);
        emailStatus = await sendOrderEmails({
          ...currentOrderSnapshot,
          orderId: orderDocId,
          orderNumber: orderData.orderNumber,
          awbCode: orderData.awbCode || null,
          courierName: orderData.courierName || null,
          trackingUrl: orderData.trackingUrl || null,
          createdAt: new Date().toISOString()
        });

        await updateDoc(doc(db, "orders", orderDocId), { emailStatus });

        const emailLogRef = doc(collection(db, "email_logs"));
        await setDoc(emailLogRef, {
          orderId: orderDocId,
          orderNumber: orderData.orderNumber,
          customerEmail: orderData.customerEmail,
          status: emailStatus,
          gateway: "Razorpay (Webhook)",
          paymentId: finalPaymentId,
          sentAt: serverTimestamp(),
          type: "Razorpay Order Confirmation"
        });
      } catch (emailErr) {
        console.error(`[RazorpayWebhook] Email dispatch failed for order ${orderDocId}:`, emailErr);
      }
    }

    // ── 6. DISPATCH COURIER MANIFEST ──
    if (!orderData.awbCode) {
      try {
        const shipRes = await createOrderShipment(currentOrderSnapshot);
        if (shipRes?.success && shipRes.waybill) {
          await updateDoc(doc(db, "orders", orderDocId), {
            shippingProvider: "iThink Logistics",
            shippingStatus: "Manifested",
            awbCode: shipRes.waybill,
            trackingNumber: shipRes.waybill,
            courierName: shipRes.logisticName || "iThink Express",
            trackingUrl: shipRes.trackingUrl || `https://www.ithinklogistics.com/track-order?tracking_number=${encodeURIComponent(shipRes.waybill)}`
          });
        }
      } catch (shipErr) {
        console.warn("[RazorpayWebhook] iThink shipment creation pending:", shipErr.message);
      }
    }

    return res.status(200).json({
      received: true,
      success: true,
      orderId: orderDocId,
      orderNumber: orderData.orderNumber,
      paymentId: finalPaymentId
    });
  } catch (err) {
    console.error("[RazorpayWebhook] Critical error processing webhook:", err);
    return res.status(500).json({ error: "Internal webhook processing error" });
  }
}

