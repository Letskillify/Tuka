import {
    CFPaymentGateway,
    CFConfig,
    CFEnvironment
} from "cashfree-pg-sdk-nodejs";

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
    serverTimestamp
} from "../_lib/firebaseServer.js";

import { sendOrderEmails } from "../_lib/emailService.js";
import { deductOrderInventory } from "../_lib/inventoryService.js";
import { createOrderShipment } from "../_lib/ithinkLogistics.js";

const generateOrderNumber = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomStr = "";
    for (let i = 0; i < 6; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ORD-${randomStr}`;
};

export default async function handler(req, res) {
    if (req.method !== "GET" && req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cashfreeOrderId =
            req.query?.orderId ||
            req.query?.cf_order_id ||
            req.query?.order_id ||
            req.body?.cashfreeOrderId ||
            req.body?.orderId ||
            req.body?.cf_order_id;

        const claimPaymentId = req.query?.paymentId || req.body?.paymentId || req.body?.claimPaymentId;
        const claimAmount = Number(req.body?.claimAmount || 1);
        const claimCustomerEmail = req.body?.claimEmail || req.query?.email || "customer@tuka.co.in";

        const db = clientDb;
        const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID;
        const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY;
        const rawEnv = process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_ENV || "";
        const isProd = rawEnv.toUpperCase() === "PRODUCTION" || (secretKey && secretKey.includes("_prod_"));

        // Special Admin / Customer Claim Action by Payment ID (e.g. for past unlinked payments)
        if (req.body?.action === "claim-payment" || (claimPaymentId && !cashfreeOrderId)) {
            const cleanPaymentId = String(claimPaymentId).trim();
            const existingQ = query(collection(db, "orders"), where("paymentId", "==", cleanPaymentId));
            const existingSnap = await getDocs(existingQ);
            if (!existingSnap.empty) {
                const docSnap = existingSnap.docs[0];
                return res.status(200).json({
                    success: true,
                    alreadyClaimed: true,
                    orderId: docSnap.id,
                    orderNumber: docSnap.data().orderNumber,
                    order: { id: docSnap.id, ...docSnap.data() }
                });
            }

            const newOrderRef = doc(collection(db, "orders"));
            const orderId = newOrderRef.id;
            const orderNumber = generateOrderNumber();
            const claimedOrder = {
                orderId,
                orderNumber,
                cashfreeOrderId: `CF_CLAIM_${cleanPaymentId}`,
                paymentId: cleanPaymentId,
                paymentStatus: "Paid",
                orderStatus: "confirmed",
                paymentMethod: "Online Payment (Cashfree)",
                total: claimAmount,
                subtotal: claimAmount,
                discount: 0,
                shipping: 0,
                tax: 0,
                currency: "INR",
                customerName: req.body?.customerName || "Customer",
                customerEmail: claimCustomerEmail.toLowerCase().trim(),
                customerPhone: req.body?.customerPhone || "9999999999",
                shippingAddress: {
                    fullName: req.body?.customerName || "Customer",
                    phone: req.body?.customerPhone || "9999999999",
                    street: "Online Verification Order",
                    city: "Kolkata",
                    state: "West Bengal",
                    pincode: "700001",
                    addressType: "Home"
                },
                items: [
                    {
                        productId: "claimed_handloom",
                        productName: "Handloom drape acquisition",
                        productImage: "https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=300",
                        quantity: 1,
                        unitPrice: claimAmount,
                        subtotal: claimAmount
                    }
                ],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                claimedManually: true,
                inventoryDeducted: true,
                emailStatus: { customer: "pending", admin: "pending" }
            };

            await setDoc(newOrderRef, claimedOrder);
            return res.status(200).json({
                success: true,
                claimed: true,
                orderId,
                orderNumber,
                order: claimedOrder,
                paymentId: cleanPaymentId
            });
        }

        if (!cashfreeOrderId) {
            return res.status(400).json({ error: "Missing required cashfreeOrderId or orderId parameter." });
        }

        let paymentList = [];
        let successfulPayment = null;
        let cfPaymentId = null;

        // Authoritative server-side verification with Cashfree API
        if (appId && secretKey && !appId.startsWith("YOUR_")) {
            const cfEnvironment = isProd ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
            const cfConfig = new CFConfig(cfEnvironment, "2023-08-01", appId, secretKey);
            const gateway = new CFPaymentGateway();

            try {
                const response = await gateway.getPaymentsForOrder(cfConfig, cashfreeOrderId);
                paymentList = Array.isArray(response?.cfPaymentsEntity)
                    ? response.cfPaymentsEntity
                    : Array.isArray(response)
                    ? response
                    : [];

                successfulPayment = paymentList.find(
                    (p) => String(p.paymentStatus || p.payment_status).toUpperCase() === "SUCCESS"
                );

                if (successfulPayment) {
                    cfPaymentId = successfulPayment.cfPaymentId || successfulPayment.cf_payment_id;
                }
            } catch (gatewayErr) {
                console.error("[VerifyOrder] Cashfree Gateway verification error:", gatewayErr?.response?.data || gatewayErr.message);
            }
        } else {
            // Mock dev mode
            successfulPayment = { paymentStatus: "SUCCESS", cfPaymentId: `CF_MOCK_${Date.now()}` };
            cfPaymentId = successfulPayment.cfPaymentId;
        }

        if (!successfulPayment) {
            const hasFailed = paymentList.some((p) =>
                ["FAILED", "USER_DROPPED", "CANCELLED"].includes(String(p.paymentStatus || p.payment_status).toUpperCase())
            );
            return res.status(400).json({
                success: false,
                paymentStatus: hasFailed ? "FAILED" : "PENDING",
                error: hasFailed
                    ? "Payment was unsuccessful or cancelled by user."
                    : "Payment status is pending verification."
            });
        }

        const finalPaymentId = String(cfPaymentId || claimPaymentId || cashfreeOrderId);

        // Find Order in Firestore by cashfreeOrderId
        let orderDocSnap = null;
        const q = query(collection(db, "orders"), where("cashfreeOrderId", "==", cashfreeOrderId));
        const snap = await getDocs(q);

        if (!snap.empty) {
            orderDocSnap = snap.docs[0];
        } else {
            // Direct document ID fallback
            const directSnap = await getDoc(doc(db, "orders", cashfreeOrderId));
            if (directSnap.exists()) {
                orderDocSnap = directSnap;
            }
        }

        if (orderDocSnap) {
            const orderDocId = orderDocSnap.id;
            const orderData = { id: orderDocId, ...orderDocSnap.data() };

            const isAlreadyPaid = orderData.paymentStatus === "Paid";
            const isInventoryDeducted = orderData.inventoryDeducted === true;
            const isEmailSent = orderData.emailStatus?.customer === "sent";

            // IDEMPOTENCY GUARD:
            // If the order has already been verified, paid, inventory deducted, and email sent, return cleanly
            if (isAlreadyPaid && isInventoryDeducted && isEmailSent) {
                console.log(`[VerifyOrder] Order ${orderDocId} is already fully confirmed, stock deducted, and email sent.`);
                return res.status(200).json({
                    success: true,
                    verified: true,
                    alreadyProcessed: true,
                    orderId: orderDocId,
                    orderNumber: orderData.orderNumber,
                    paymentId: orderData.paymentId || finalPaymentId,
                    order: orderData
                });
            }

            // 1. Update Order Status to PAID & Confirmed (if not already)
            const updates = {};
            if (!isAlreadyPaid) {
                updates.paymentStatus = "Paid";
                updates.orderStatus = "confirmed";
                updates.paymentId = finalPaymentId;
                updates.paymentMethod = "Online Payment (Cashfree)";
                updates.paymentDetails = {
                    cashfreeOrderId,
                    cfPaymentId: finalPaymentId,
                    paymentStatus: "SUCCESS",
                    paymentTime: successfulPayment?.paymentCompletionTime || new Date().toISOString()
                };
                updates.updatedAt = serverTimestamp();

                await updateDoc(doc(db, "orders", orderDocId), updates);

                if (orderData.userId && orderData.userId !== "guest") {
                    try {
                        await updateDoc(doc(db, "users", orderData.userId, "orders", orderDocId), updates);
                    } catch (e) {}
                }
            }

            const currentOrderSnapshot = { ...orderData, ...updates };

            // 2. Concurrency-Safe Stock Deduction (Bug 2 Fix)
            if (!isInventoryDeducted) {
                try {
                    console.log(`[VerifyOrder] Concurrency-safe stock deduction for order ${orderDocId}...`);
                    await deductOrderInventory(db, orderDocId, orderData.items, orderData.userId);
                    currentOrderSnapshot.inventoryDeducted = true;
                } catch (invErr) {
                    console.error(`[VerifyOrder] Stock deduction error for order ${orderDocId}:`, invErr.message);
                }
            }

            // 3. Dispatch Order Confirmation Email (Bug 1 Fix - Awaited & Idempotent)
            let emailStatus = currentOrderSnapshot.emailStatus || { customer: "pending", admin: "pending" };
            if (emailStatus.customer !== "sent") {
                try {
                    console.log(`[VerifyOrder] Sending order confirmation email for order ${orderDocId} to ${orderData.customerEmail}...`);
                    emailStatus = await sendOrderEmails({
                        ...currentOrderSnapshot,
                        orderId: orderDocId,
                        orderNumber: orderData.orderNumber,
                        awbCode: currentOrderSnapshot.awbCode || null,
                        courierName: currentOrderSnapshot.courierName || null,
                        trackingUrl: currentOrderSnapshot.trackingUrl || null,
                        createdAt: orderData.createdAt
                            ? (orderData.createdAt.toDate ? orderData.createdAt.toDate().toISOString() : new Date(orderData.createdAt).toISOString())
                            : new Date().toISOString()
                    });

                    await updateDoc(doc(db, "orders", orderDocId), { emailStatus });
                    currentOrderSnapshot.emailStatus = emailStatus;

                    // Audit log to Firebase email_logs
                    const emailLogRef = doc(collection(db, "email_logs"));
                    await setDoc(emailLogRef, {
                        orderId: orderDocId,
                        orderNumber: orderData.orderNumber,
                        customerEmail: orderData.customerEmail,
                        status: emailStatus,
                        gateway: "Cashfree",
                        paymentId: finalPaymentId,
                        sentAt: serverTimestamp(),
                        type: "Cashfree Order Confirmation"
                    });
                    console.log(`[VerifyOrder] Confirmation email sent and logged successfully for order ${orderDocId}.`);
                } catch (emailErr) {
                    console.error(`[VerifyOrder] Failed to send order confirmation email for order ${orderDocId}:`, emailErr);
                }
            }

            // 4. Dispatch Courier Manifest (iThink Logistics)
            if (!currentOrderSnapshot.awbCode) {
                try {
                    const shipRes = await createOrderShipment(currentOrderSnapshot);
                    if (shipRes?.success && shipRes.waybill) {
                        const shipUpdates = {
                            shippingProvider: "iThink Logistics",
                            shippingStatus: "Manifested",
                            awbCode: shipRes.waybill,
                            trackingNumber: shipRes.waybill,
                            courierName: shipRes.logisticName || "iThink Express",
                            trackingUrl: shipRes.trackingUrl || `https://ithinklogistics.trackshipment.in/${shipRes.waybill}`
                        };
                        await updateDoc(doc(db, "orders", orderDocId), shipUpdates);
                        Object.assign(currentOrderSnapshot, shipUpdates);
                    }
                } catch (shipErr) {
                    console.warn("[VerifyOrder] iThink dispatch pending notice:", shipErr.message);
                }
            }

            return res.status(200).json({
                success: true,
                verified: true,
                orderId: orderDocId,
                orderNumber: orderData.orderNumber,
                paymentId: finalPaymentId,
                order: currentOrderSnapshot
            });
        }

        // ── 5. Orphan Order Recovery (if order record was not found initially) ──
        console.warn(`[VerifyOrder] Order doc not found for cashfreeOrderId: ${cashfreeOrderId}. Initiating orphan order recovery...`);
        const newOrderRef = doc(collection(db, "orders"));
        const orderId = newOrderRef.id;
        const orderNumber = generateOrderNumber();

        const recoveredOrder = {
            orderId,
            orderNumber,
            cashfreeOrderId,
            paymentId: finalPaymentId,
            paymentStatus: "Paid",
            orderStatus: "confirmed",
            paymentMethod: "Online Payment (Cashfree)",
            paymentDetails: {
                cashfreeOrderId,
                cfPaymentId: finalPaymentId,
                paymentStatus: "SUCCESS",
                verifiedAt: new Date().toISOString()
            },
            total: successfulPayment?.paymentAmount || 1,
            subtotal: successfulPayment?.paymentAmount || 1,
            discount: 0,
            shipping: 0,
            tax: 0,
            currency: "INR",
            customerName: "Valued Customer",
            customerEmail: claimCustomerEmail.toLowerCase().trim(),
            customerPhone: "9999999999",
            shippingAddress: {
                fullName: "Valued Customer",
                phone: "9999999999",
                street: "Recovered Cashfree Order",
                city: "Kolkata",
                state: "West Bengal",
                pincode: "700001",
                addressType: "Home"
            },
            items: [
                {
                    productId: "handloom_item",
                    productName: "Bengal Handloom Drape",
                    productImage: "https://images.unsplash.com/photo-1610030470298-40e1eaccf77d?auto=format&fit=crop&q=80&w=300",
                    quantity: 1,
                    unitPrice: successfulPayment?.paymentAmount || 1,
                    subtotal: successfulPayment?.paymentAmount || 1
                }
            ],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            inventoryDeducted: false,
            emailStatus: { customer: "pending", admin: "pending" }
        };

        await setDoc(newOrderRef, recoveredOrder);

        // Deduct inventory and dispatch email for recovered order
        try {
            await deductOrderInventory(db, orderId, recoveredOrder.items);
            recoveredOrder.inventoryDeducted = true;
        } catch (rInvErr) {
            console.error(`[VerifyOrder] Stock deduction error for recovered order ${orderId}:`, rInvErr.message);
        }

        try {
            const emailStatus = await sendOrderEmails({
                ...recoveredOrder,
                orderId,
                orderNumber,
                createdAt: new Date().toISOString()
            });
            await updateDoc(doc(db, "orders", orderId), { emailStatus });
            recoveredOrder.emailStatus = emailStatus;

            const emailLogRef = doc(collection(db, "email_logs"));
            await setDoc(emailLogRef, {
                orderId,
                orderNumber,
                customerEmail: recoveredOrder.customerEmail,
                status: emailStatus,
                gateway: "Cashfree (Recovered)",
                paymentId: finalPaymentId,
                sentAt: serverTimestamp(),
                type: "Cashfree Order Confirmation"
            });
        } catch (rEmailErr) {
            console.error(`[VerifyOrder] Email error for recovered order ${orderId}:`, rEmailErr.message);
        }

        return res.status(200).json({
            success: true,
            verified: true,
            recovered: true,
            orderId,
            orderNumber,
            paymentId: finalPaymentId,
            order: recoveredOrder
        });

    } catch (err) {
        console.error("[VerifyOrder] Error:", err?.response?.data || err.message || err);
        return res.status(500).json({ error: err?.response?.data?.message || err.message || "Failed to verify order." });
    }
}
