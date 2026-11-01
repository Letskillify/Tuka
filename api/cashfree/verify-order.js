import crypto from "node:crypto";
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
        const queryOrderId =
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
        if (req.body?.action === "claim-payment" || (claimPaymentId && !queryOrderId)) {
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

        if (!queryOrderId) {
            return res.status(400).json({ error: "Missing required cashfreeOrderId or orderId parameter." });
        }

        const rawOrderIdInput = String(queryOrderId).trim();

        // ── 1. RESOLVE FIRESTORE ORDER RECORD (Support internal doc ID, cashfreeOrderId, and orderNumber) ──
        let orderDocSnap = null;

        // Search 1: by cashfreeOrderId
        const cfQ = query(collection(db, "orders"), where("cashfreeOrderId", "==", rawOrderIdInput));
        const cfSnap = await getDocs(cfQ);
        if (!cfSnap.empty) {
            orderDocSnap = cfSnap.docs[0];
        } else {
            // Search 2: by direct document ID
            const directSnap = await getDoc(doc(db, "orders", rawOrderIdInput));
            if (directSnap.exists()) {
                orderDocSnap = directSnap;
            } else {
                // Search 3: by human-readable orderNumber (e.g. ORD-YUWLCF)
                const numQ = query(collection(db, "orders"), where("orderNumber", "==", rawOrderIdInput.toUpperCase()));
                const numSnap = await getDocs(numQ);
                if (!numSnap.empty) {
                    orderDocSnap = numSnap.docs[0];
                }
            }
        }

        const existingOrderData = orderDocSnap ? { id: orderDocSnap.id, ...orderDocSnap.data() } : null;
        const effectiveCfOrderId = existingOrderData?.cashfreeOrderId || rawOrderIdInput;

        console.log(`[VerifyOrder] Verifying Cashfree payment for ID: "${rawOrderIdInput}" -> Cashfree Order ID: "${effectiveCfOrderId}"`);

        // ── 2. AUTHORITATIVE SERVER-SIDE VERIFICATION WITH CASHFREE API ──
        let paymentList = [];
        let successfulPayment = null;
        let cfPaymentId = null;
        let bankReference = null;
        let paymentGroup = null;
        let paymentAmount = null;
        let paymentCurrency = "INR";
        let paymentTime = null;
        let paymentMessage = null;
        let cfOrderDetails = null;

        if (appId && secretKey && !appId.startsWith("YOUR_")) {
            const cfEnvironment = isProd ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
            const cfConfig = new CFConfig(cfEnvironment, "2023-08-01", appId, secretKey);
            const gateway = new CFPaymentGateway();

            // A. Query payments for this order from Cashfree
            try {
                const response = await gateway.getPaymentsForOrder(cfConfig, effectiveCfOrderId);
                // Note: v2 SDK returns cfPaymentsEntities (plural)
                paymentList = Array.isArray(response?.cfPaymentsEntities)
                    ? response.cfPaymentsEntities
                    : Array.isArray(response?.cfPaymentsEntity)
                    ? response.cfPaymentsEntity
                    : Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response)
                    ? response
                    : [];

                successfulPayment = paymentList.find(
                    (p) => String(p.paymentStatus || p.payment_status).toUpperCase() === "SUCCESS"
                );

                if (successfulPayment) {
                    cfPaymentId = String(successfulPayment.cfPaymentId || successfulPayment.cf_payment_id || "");
                    bankReference = String(successfulPayment.bankReference || successfulPayment.bank_reference || "");
                    paymentGroup = String(successfulPayment.paymentGroup || successfulPayment.payment_group || "");
                    paymentAmount = Number(successfulPayment.paymentAmount || successfulPayment.order_amount || 0);
                    paymentCurrency = String(successfulPayment.paymentCurrency || successfulPayment.currency || "INR");
                    paymentTime = successfulPayment.paymentTime || successfulPayment.payment_completion_time || new Date().toISOString();
                    paymentMessage = successfulPayment.paymentMessage || successfulPayment.payment_message || "Transaction Success";
                }
            } catch (gatewayErr) {
                console.warn("[VerifyOrder] Cashfree getPaymentsForOrder warning:", gatewayErr?.response?.data || gatewayErr.message);
            }

            // B. Dual Verification: Query order state directly from Cashfree
            try {
                const orderRes = await gateway.getOrder(cfConfig, effectiveCfOrderId);
                cfOrderDetails = orderRes?.cfOrder || orderRes?.data || orderRes;
                const orderStatusGateway = String(cfOrderDetails?.orderStatus || cfOrderDetails?.order_status || "").toUpperCase();

                if (orderStatusGateway === "PAID" && !successfulPayment) {
                    // Gateway confirms order is PAID even if payments array was still capturing
                    successfulPayment = {
                        cfPaymentId: cfOrderDetails?.cfOrderId || `CF_ORD_${effectiveCfOrderId}`,
                        paymentStatus: "SUCCESS",
                        paymentAmount: Number(cfOrderDetails?.orderAmount || existingOrderData?.total || 1),
                        paymentCurrency: cfOrderDetails?.orderCurrency || "INR",
                        paymentTime: new Date().toISOString()
                    };
                    cfPaymentId = String(successfulPayment.cfPaymentId);
                    paymentAmount = successfulPayment.paymentAmount;
                    paymentCurrency = successfulPayment.paymentCurrency;
                    paymentTime = successfulPayment.paymentTime;
                }
            } catch (orderErr) {
                console.warn("[VerifyOrder] Cashfree getOrder warning:", orderErr?.response?.data || orderErr.message);
            }
        } else {
            // Mock dev mode fallback
            successfulPayment = { paymentStatus: "SUCCESS", cfPaymentId: `CF_MOCK_${Date.now()}` };
            cfPaymentId = successfulPayment.cfPaymentId;
            paymentAmount = existingOrderData?.total || 1;
            paymentTime = new Date().toISOString();
        }

        // ── 3. HANDLE UNVERIFIED / PENDING / FAILED PAYMENTS ──
        if (!successfulPayment) {
            // SAFEGUARD: Never overwrite a previously verified successful payment!
            if (existingOrderData && existingOrderData.paymentStatus === "Paid") {
                console.log(`[VerifyOrder] Order ${existingOrderData.id} was already verified as Paid. Refusing to downgrade status.`);
                return res.status(200).json({
                    success: true,
                    verified: true,
                    alreadyPaid: true,
                    orderId: existingOrderData.id,
                    orderNumber: existingOrderData.orderNumber,
                    paymentId: existingOrderData.paymentId,
                    order: existingOrderData
                });
            }

            const hasFailed = paymentList.some((p) =>
                ["FAILED", "USER_DROPPED", "CANCELLED"].includes(String(p.paymentStatus || p.payment_status).toUpperCase())
            );

            if (hasFailed && existingOrderData && existingOrderData.paymentStatus !== "Paid") {
                await updateDoc(doc(db, "orders", existingOrderData.id), {
                    paymentStatus: "Failed",
                    orderStatus: "payment_failed",
                    updatedAt: serverTimestamp()
                });
            }

            return res.status(200).json({
                success: false,
                verified: false,
                paymentStatus: hasFailed ? "FAILED" : "PENDING",
                error: hasFailed
                    ? "Payment was unsuccessful or cancelled by user."
                    : "Payment status is pending verification on Cashfree.",
                order: existingOrderData
            });
        }

        // ── 4. PAYMENT IS CONFIRMED SUCCESSFUL ──
        const finalPaymentId = String(cfPaymentId || claimPaymentId || effectiveCfOrderId);

        if (orderDocSnap) {
            const orderDocId = orderDocSnap.id;
            const orderData = { id: orderDocId, ...orderDocSnap.data() };

            const isAlreadyPaid = orderData.paymentStatus === "Paid";
            const isInventoryDeducted = orderData.inventoryDeducted === true;
            const isEmailSent = orderData.emailStatus?.customer === "sent";

            // IDEMPOTENCY GUARD:
            // If the order has already been verified, paid, inventory deducted, and email sent, return cleanly!
            if (isAlreadyPaid && isInventoryDeducted && isEmailSent) {
                console.log(`[VerifyOrder] Order ${orderDocId} is already fully confirmed, stock deducted, and email sent.`);
                return res.status(200).json({
                    success: true,
                    verified: true,
                    alreadyProcessed: true,
                    orderId: orderDocId,
                    orderNumber: orderData.orderNumber,
                    paymentId: orderData.paymentId || finalPaymentId,
                    bankReference: orderData.bankReference || bankReference,
                    order: orderData
                });
            }

            // A. Update Order Status to PAID & Confirmed in Firestore
            const updates = {
                paymentStatus: "Paid",
                orderStatus: "confirmed",
                paymentId: finalPaymentId,
                cfPaymentId: finalPaymentId,
                bankReference: bankReference || orderData.bankReference || null,
                paymentMethod: "Online Payment (Cashfree)",
                paymentDetails: {
                    gateway: "Cashfree",
                    cashfreeOrderId: effectiveCfOrderId,
                    cfOrderId: cfOrderDetails?.cfOrderId || null,
                    cfPaymentId: finalPaymentId,
                    paymentId: finalPaymentId,
                    bankReference: bankReference || null,
                    paymentGroup: paymentGroup || null,
                    paymentAmount: paymentAmount || orderData.total,
                    paymentCurrency: paymentCurrency || "INR",
                    paymentStatus: "SUCCESS",
                    paymentTime: paymentTime || new Date().toISOString(),
                    paymentMessage: paymentMessage || "Transaction Success",
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

            // B. Concurrency-Safe Stock Deduction (Atomic Firestore Transaction)
            if (!isInventoryDeducted) {
                try {
                    console.log(`[VerifyOrder] Concurrency-safe stock deduction for order ${orderDocId}...`);
                    await deductOrderInventory(db, orderDocId, orderData.items, orderData.userId);
                    currentOrderSnapshot.inventoryDeducted = true;
                } catch (invErr) {
                    console.error(`[VerifyOrder] Stock deduction error for order ${orderDocId}:`, invErr.message);
                }
            }

            // C. Dispatch Order Confirmation Email (Awaited & Idempotent)
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
                        bankReference: bankReference || null,
                        sentAt: serverTimestamp(),
                        type: "Cashfree Order Confirmation"
                    });
                    console.log(`[VerifyOrder] Confirmation email sent and logged successfully for order ${orderDocId}.`);
                } catch (emailErr) {
                    console.error(`[VerifyOrder] Failed to send order confirmation email for order ${orderDocId}:`, emailErr);
                }
            }

            // D. Dispatch Courier Manifest (iThink Logistics)
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
                paymentStatus: "PAID",
                orderId: orderDocId,
                orderNumber: orderData.orderNumber,
                paymentId: finalPaymentId,
                bankReference: bankReference || null,
                order: currentOrderSnapshot
            });
        }

        // ── 5. ORPHAN ORDER RECOVERY (if order record was not found initially) ──
        console.warn(`[VerifyOrder] Order doc not found for cashfreeOrderId: ${effectiveCfOrderId}. Initiating orphan order recovery...`);
        const newOrderRef = doc(collection(db, "orders"));
        const orderId = newOrderRef.id;
        const orderNumber = generateOrderNumber();

        const recoveredOrder = {
            orderId,
            orderNumber,
            cashfreeOrderId: effectiveCfOrderId,
            paymentId: finalPaymentId,
            cfPaymentId: finalPaymentId,
            bankReference: bankReference || null,
            paymentStatus: "Paid",
            orderStatus: "confirmed",
            paymentMethod: "Online Payment (Cashfree)",
            paymentDetails: {
                gateway: "Cashfree",
                cashfreeOrderId: effectiveCfOrderId,
                cfOrderId: cfOrderDetails?.cfOrderId || null,
                cfPaymentId: finalPaymentId,
                paymentId: finalPaymentId,
                bankReference: bankReference || null,
                paymentGroup: paymentGroup || null,
                paymentAmount: paymentAmount || 1,
                paymentCurrency: paymentCurrency || "INR",
                paymentStatus: "SUCCESS",
                paymentTime: paymentTime || new Date().toISOString(),
                paymentMessage: paymentMessage || "Transaction Success",
                verifiedAt: new Date().toISOString()
            },
            total: paymentAmount || 1,
            subtotal: paymentAmount || 1,
            discount: 0,
            shipping: 0,
            tax: 0,
            currency: paymentCurrency || "INR",
            customerName: cfOrderDetails?.customerDetails?.customerName || "Valued Customer",
            customerEmail: cfOrderDetails?.customerDetails?.customerEmail || claimCustomerEmail.toLowerCase().trim(),
            customerPhone: cfOrderDetails?.customerDetails?.customerPhone || "9999999999",
            shippingAddress: {
                fullName: cfOrderDetails?.customerDetails?.customerName || "Valued Customer",
                phone: cfOrderDetails?.customerDetails?.customerPhone || "9999999999",
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
                    unitPrice: paymentAmount || 1,
                    subtotal: paymentAmount || 1
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
                bankReference: bankReference || null,
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
            paymentStatus: "PAID",
            orderId,
            orderNumber,
            paymentId: finalPaymentId,
            bankReference: bankReference || null,
            order: recoveredOrder
        });

    } catch (err) {
        console.error("[VerifyOrder] Critical verification error:", err?.response?.data || err.message || err);
        return res.status(500).json({ error: err?.response?.data?.message || err.message || "Failed to verify order." });
    }
}
