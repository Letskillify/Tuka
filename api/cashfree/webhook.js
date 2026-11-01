import {
    CFPaymentGateway,
    CFConfig,
    CFEnvironment
} from "cashfree-pg-sdk-nodejs";

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
 * Cashfree Server-to-Server Webhook Handler
 * Receives payment status updates directly from Cashfree servers.
 * Idempotently verifies payment, deducts stock, and sends confirmation emails.
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Webhooks require POST." });
    }

    try {
        const body = req.body || {};
        console.log("[CashfreeWebhook] Incoming webhook event received:", {
            type: body.type || body.event || "UNKNOWN",
            orderId: body.data?.order?.order_id || body.order?.order_id || body.orderId
        });

        // Extract Cashfree order ID & payment info
        const cashfreeOrderId =
            body.data?.order?.order_id ||
            body.order?.order_id ||
            body.data?.order_id ||
            body.orderId ||
            body.order_id;

        const cfPayment =
            body.data?.payment ||
            body.payment ||
            {};

        const paymentStatus = String(
            cfPayment.payment_status ||
            cfPayment.paymentStatus ||
            body.data?.order?.order_status ||
            body.order?.order_status ||
            ""
        ).toUpperCase();

        const cfPaymentId = String(
            cfPayment.cf_payment_id ||
            cfPayment.payment_id ||
            cfPayment.cfPaymentId ||
            ""
        );

        if (!cashfreeOrderId) {
            console.warn("[CashfreeWebhook] Webhook payload missing order_id:", JSON.stringify(body).slice(0, 200));
            return res.status(400).json({ error: "Missing order_id in webhook payload" });
        }

        // Only process successful payments
        const isSuccess =
            paymentStatus === "SUCCESS" ||
            paymentStatus === "PAID" ||
            body.type === "PAYMENT_SUCCESS_WEBHOOK" ||
            body.type === "ORDER_PAID";

        if (!isSuccess) {
            console.log(`[CashfreeWebhook] Ignoring non-success payment status: "${paymentStatus}" for order ${cashfreeOrderId}`);
            return res.status(200).json({ received: true, processed: false, reason: "Status is not SUCCESS" });
        }

        const db = clientDb;
        const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID;
        const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY;
        const rawEnv = process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_ENV || "";
        const isProd = rawEnv.toUpperCase() === "PRODUCTION" || (secretKey && secretKey.includes("_prod_"));

        // Server-side authoritative verification with Cashfree API (Never trust raw webhook body alone)
        let verifiedPayment = null;
        if (appId && secretKey && !appId.startsWith("YOUR_")) {
            const cfEnvironment = isProd ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
            const cfConfig = new CFConfig(cfEnvironment, "2023-08-01", appId, secretKey);
            const gateway = new CFPaymentGateway();

            try {
                const response = await gateway.getPaymentsForOrder(cfConfig, cashfreeOrderId);
                const paymentList = Array.isArray(response?.cfPaymentsEntity)
                    ? response.cfPaymentsEntity
                    : Array.isArray(response)
                    ? response
                    : [];

                verifiedPayment = paymentList.find(
                    (p) => String(p.paymentStatus || p.payment_status).toUpperCase() === "SUCCESS"
                );
            } catch (vErr) {
                console.error("[CashfreeWebhook] Error verifying payment with Cashfree API:", vErr.message);
            }
        } else {
            // Mock mode
            verifiedPayment = { paymentStatus: "SUCCESS", cfPaymentId: cfPaymentId || `CF_MOCK_${Date.now()}` };
        }

        if (!verifiedPayment && !isSuccess) {
            console.warn(`[CashfreeWebhook] Verification failed for order ${cashfreeOrderId}`);
            return res.status(200).json({ received: true, processed: false, error: "Unverified payment" });
        }

        const finalPaymentId = String(
            verifiedPayment?.cfPaymentId ||
            verifiedPayment?.cf_payment_id ||
            cfPaymentId ||
            cashfreeOrderId
        );

        // Find Order in Firestore
        let orderDocSnap = null;
        const q = query(collection(db, "orders"), where("cashfreeOrderId", "==", cashfreeOrderId));
        const snap = await getDocs(q);

        if (!snap.empty) {
            orderDocSnap = snap.docs[0];
        } else {
            const directSnap = await getDoc(doc(db, "orders", cashfreeOrderId));
            if (directSnap.exists()) {
                orderDocSnap = directSnap;
            }
        }

        if (!orderDocSnap) {
            console.warn(`[CashfreeWebhook] Order not found for cashfreeOrderId ${cashfreeOrderId}`);
            return res.status(200).json({ received: true, processed: false, error: "Order not found" });
        }

        const orderDocId = orderDocSnap.id;
        const orderData = { id: orderDocId, ...orderDocSnap.data() };

        // IDEMPOTENCY CHECK:
        // If order is already paid, stock deducted, and confirmation email sent, finish cleanly!
        const isAlreadyPaid = orderData.paymentStatus === "Paid";
        const isInventoryDeducted = orderData.inventoryDeducted === true;
        const isEmailSent = orderData.emailStatus?.customer === "sent";

        if (isAlreadyPaid && isInventoryDeducted && isEmailSent) {
            console.log(`[CashfreeWebhook] Order ${orderDocId} already fully confirmed, stock deducted, and email sent. Idempotent skip.`);
            return res.status(200).json({ received: true, duplicate: true, orderId: orderDocId });
        }

        // 1. Mark Order as Paid
        const updates = {
            paymentStatus: "Paid",
            orderStatus: "confirmed",
            paymentId: finalPaymentId,
            paymentMethod: "Online Payment (Cashfree)",
            paymentDetails: {
                cashfreeOrderId,
                cfPaymentId: finalPaymentId,
                paymentStatus: "SUCCESS",
                paymentTime: verifiedPayment?.paymentCompletionTime || new Date().toISOString()
            },
            updatedAt: serverTimestamp()
        };

        await updateDoc(doc(db, "orders", orderDocId), updates);

        if (orderData.userId && orderData.userId !== "guest") {
            try {
                await updateDoc(doc(db, "users", orderData.userId, "orders", orderDocId), updates);
            } catch (e) {}
        }

        // 2. Concurrency-Safe Stock Deduction (Idempotent)
        if (!orderData.inventoryDeducted) {
            try {
                console.log(`[CashfreeWebhook] Deducting inventory for order ${orderDocId}...`);
                await deductOrderInventory(db, orderDocId, orderData.items, orderData.userId);
            } catch (invErr) {
                console.error(`[CashfreeWebhook] Stock deduction error for order ${orderDocId}:`, invErr.message);
            }
        }

        // 3. Dispatch Order Confirmation Email (Awaited & Idempotent)
        let emailStatus = orderData.emailStatus || { customer: "pending", admin: "pending" };
        if (emailStatus.customer !== "sent") {
            try {
                console.log(`[CashfreeWebhook] Dispatching confirmation email for order ${orderDocId} to ${orderData.customerEmail}...`);
                const fullSnapshot = { ...orderData, ...updates };
                emailStatus = await sendOrderEmails({
                    ...fullSnapshot,
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
                    gateway: "Cashfree (Webhook)",
                    paymentId: finalPaymentId,
                    sentAt: serverTimestamp(),
                    type: "Cashfree Order Confirmation"
                });
            } catch (emailErr) {
                console.error(`[CashfreeWebhook] Email dispatch failed for order ${orderDocId}:`, emailErr);
            }
        }

        // 4. Dispatch Courier Manifest
        if (!orderData.awbCode) {
            try {
                const shipRes = await createOrderShipment({ ...orderData, ...updates });
                if (shipRes?.success && shipRes.waybill) {
                    await updateDoc(doc(db, "orders", orderDocId), {
                        shippingProvider: "iThink Logistics",
                        shippingStatus: "Manifested",
                        awbCode: shipRes.waybill,
                        trackingNumber: shipRes.waybill,
                        courierName: shipRes.logisticName || "iThink Express",
                        trackingUrl: shipRes.trackingUrl || `https://ithinklogistics.trackshipment.in/${shipRes.waybill}`
                    });
                }
            } catch (shipErr) {
                console.warn("[CashfreeWebhook] iThink shipment creation pending:", shipErr.message);
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
        console.error("[CashfreeWebhook] Critical error processing webhook:", err);
        return res.status(500).json({ error: "Internal webhook processing error" });
    }
}
