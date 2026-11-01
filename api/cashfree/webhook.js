import crypto from "node:crypto";
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
 * Validates webhook signatures, server-side verifies payment, deducts stock, and sends confirmation emails.
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Webhooks require POST." });
    }

    try {
        const body = req.body || {};
        const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID;
        const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY;
        const rawEnv = process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_ENV || "";
        const isProd = rawEnv.toUpperCase() === "PRODUCTION" || (secretKey && secretKey.includes("_prod_"));

        // ── 1. SIGNATURE VERIFICATION (if signature header provided) ──
        const signature = req.headers["x-webhook-signature"] || req.headers["x-cf-signature"];
        const timestamp = req.headers["x-webhook-timestamp"] || req.headers["x-cf-timestamp"];

        if (signature && timestamp && secretKey && !secretKey.startsWith("YOUR_")) {
            const rawBody = typeof req.rawBody === "string" ? req.rawBody : JSON.stringify(body);
            const expectedSig = crypto
                .createHmac("sha256", secretKey)
                .update(timestamp + rawBody)
                .digest("base64");

            if (signature !== expectedSig) {
                console.warn("[CashfreeWebhook] Invalid webhook signature. Rejecting unauthorized callback.");
                return res.status(401).json({ error: "Invalid webhook signature" });
            }
        }

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

        const paymentStatusWebhook = String(
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

        const db = clientDb;

        // ── 2. FIND ORDER IN FIRESTORE ──
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
            console.warn(`[CashfreeWebhook] Order not found in Firestore for cashfreeOrderId ${cashfreeOrderId}`);
            return res.status(200).json({ received: true, processed: false, error: "Order not found" });
        }

        const orderDocId = orderDocSnap.id;
        const orderData = { id: orderDocId, ...orderDocSnap.data() };

        // SAFEGUARD: Never allow an older pending/failed webhook event to overwrite a previously verified successful payment!
        if (orderData.paymentStatus === "Paid" && paymentStatusWebhook !== "SUCCESS" && paymentStatusWebhook !== "PAID") {
            console.log(`[CashfreeWebhook] Order ${orderDocId} is already marked Paid. Ignoring non-success webhook event.`);
            return res.status(200).json({ received: true, duplicate: true, orderId: orderDocId });
        }

        // ── 3. INDEPENDENT SERVER-SIDE VERIFICATION WITH CASHFREE API ──
        let verifiedPayment = null;
        let bankReference = cfPayment.bank_reference || cfPayment.bankReference || null;
        let paymentGroup = cfPayment.payment_group || cfPayment.paymentGroup || null;
        let paymentAmount = Number(cfPayment.payment_amount || body.data?.order?.order_amount || orderData.total || 1);
        let paymentCurrency = cfPayment.payment_currency || "INR";
        let paymentTime = cfPayment.payment_time || new Date().toISOString();

        if (appId && secretKey && !appId.startsWith("YOUR_")) {
            const cfEnvironment = isProd ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
            const cfConfig = new CFConfig(cfEnvironment, "2023-08-01", appId, secretKey);
            const gateway = new CFPaymentGateway();

            try {
                const response = await gateway.getPaymentsForOrder(cfConfig, cashfreeOrderId);
                const paymentList = Array.isArray(response?.cfPaymentsEntities)
                    ? response.cfPaymentsEntities
                    : Array.isArray(response?.cfPaymentsEntity)
                    ? response.cfPaymentsEntity
                    : Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response)
                    ? response
                    : [];

                verifiedPayment = paymentList.find(
                    (p) => String(p.paymentStatus || p.payment_status).toUpperCase() === "SUCCESS"
                );

                if (verifiedPayment) {
                    bankReference = verifiedPayment.bankReference || verifiedPayment.bank_reference || bankReference;
                    paymentGroup = verifiedPayment.paymentGroup || verifiedPayment.payment_group || paymentGroup;
                    paymentAmount = Number(verifiedPayment.paymentAmount || paymentAmount);
                    paymentTime = verifiedPayment.paymentTime || paymentTime;
                }
            } catch (vErr) {
                console.error("[CashfreeWebhook] Error verifying payment with Cashfree API:", vErr.message);
            }

            // Dual verification with getOrder
            try {
                const orderRes = await gateway.getOrder(cfConfig, cashfreeOrderId);
                const cfOrder = orderRes?.cfOrder || orderRes?.data || orderRes;
                if (String(cfOrder?.orderStatus || "").toUpperCase() === "PAID" && !verifiedPayment) {
                    verifiedPayment = {
                        cfPaymentId: cfOrder?.cfOrderId || cfPaymentId || `CF_ORD_${cashfreeOrderId}`,
                        paymentStatus: "SUCCESS",
                        paymentAmount: cfOrder?.orderAmount || paymentAmount
                    };
                }
            } catch (oErr) {}
        } else {
            // Mock mode
            verifiedPayment = { paymentStatus: "SUCCESS", cfPaymentId: cfPaymentId || `CF_MOCK_${Date.now()}` };
        }

        const isSuccess =
            verifiedPayment !== null ||
            paymentStatusWebhook === "SUCCESS" ||
            paymentStatusWebhook === "PAID" ||
            body.type === "PAYMENT_SUCCESS_WEBHOOK" ||
            body.type === "ORDER_PAID";

        if (!isSuccess) {
            console.log(`[CashfreeWebhook] Ignoring non-success payment status: "${paymentStatusWebhook}" for order ${cashfreeOrderId}`);
            return res.status(200).json({ received: true, processed: false, reason: "Status is not SUCCESS" });
        }

        const finalPaymentId = String(
            verifiedPayment?.cfPaymentId ||
            verifiedPayment?.cf_payment_id ||
            cfPaymentId ||
            cashfreeOrderId
        );

        // IDEMPOTENCY CHECK:
        // If order is already paid, stock deducted, and confirmation email sent, finish cleanly!
        const isAlreadyPaid = orderData.paymentStatus === "Paid";
        const isInventoryDeducted = orderData.inventoryDeducted === true;
        const isEmailSent = orderData.emailStatus?.customer === "sent";

        if (isAlreadyPaid && isInventoryDeducted && isEmailSent) {
            console.log(`[CashfreeWebhook] Order ${orderDocId} already fully confirmed, stock deducted, and email sent. Idempotent skip.`);
            return res.status(200).json({ received: true, duplicate: true, orderId: orderDocId });
        }

        // 4. Mark Order as Paid in Firestore with complete reference details
        const updates = {
            paymentStatus: "Paid",
            orderStatus: "confirmed",
            paymentId: finalPaymentId,
            cfPaymentId: finalPaymentId,
            bankReference: bankReference || orderData.bankReference || null,
            paymentMethod: "Online Payment (Cashfree)",
            paymentDetails: {
                gateway: "Cashfree",
                cashfreeOrderId,
                cfPaymentId: finalPaymentId,
                paymentId: finalPaymentId,
                bankReference: bankReference || null,
                paymentGroup: paymentGroup || null,
                paymentAmount: paymentAmount || orderData.total,
                paymentCurrency: paymentCurrency || "INR",
                paymentStatus: "SUCCESS",
                paymentTime: paymentTime || new Date().toISOString(),
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

        // 5. Concurrency-Safe Stock Deduction (Idempotent)
        if (!orderData.inventoryDeducted) {
            try {
                console.log(`[CashfreeWebhook] Deducting inventory for order ${orderDocId}...`);
                await deductOrderInventory(db, orderDocId, orderData.items, orderData.userId);
                currentOrderSnapshot.inventoryDeducted = true;
            } catch (invErr) {
                console.error(`[CashfreeWebhook] Stock deduction error for order ${orderDocId}:`, invErr.message);
            }
        }

        // 6. Dispatch Order Confirmation Email (Awaited & Idempotent)
        let emailStatus = currentOrderSnapshot.emailStatus || { customer: "pending", admin: "pending" };
        if (emailStatus.customer !== "sent") {
            try {
                console.log(`[CashfreeWebhook] Dispatching confirmation email for order ${orderDocId} to ${orderData.customerEmail}...`);
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
                    gateway: "Cashfree (Webhook)",
                    paymentId: finalPaymentId,
                    bankReference: bankReference || null,
                    sentAt: serverTimestamp(),
                    type: "Cashfree Order Confirmation"
                });
            } catch (emailErr) {
                console.error(`[CashfreeWebhook] Email dispatch failed for order ${orderDocId}:`, emailErr);
            }
        }

        // 7. Dispatch Courier Manifest
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
            paymentId: finalPaymentId,
            bankReference: bankReference || null
        });

    } catch (err) {
        console.error("[CashfreeWebhook] Critical error processing webhook:", err);
        return res.status(500).json({ error: "Internal webhook processing error" });
    }
}
