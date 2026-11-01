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
    runTransaction,
    serverTimestamp
} from "../_lib/firebaseServer.js";

import { sendOrderEmails } from "../_lib/emailService.js";
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
        const cashfreeOrderId = req.query?.orderId || req.query?.cf_order_id || req.query?.order_id || req.body?.cashfreeOrderId || req.body?.orderId || req.body?.cf_order_id;
        const claimPaymentId = req.query?.paymentId || req.body?.paymentId || req.body?.claimPaymentId;
        const claimAmount = Number(req.body?.claimAmount || 1);
        const claimCustomerEmail = req.body?.claimEmail || req.query?.email || "customer@tuka.co.in";

        const db = clientDb;
        const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID;
        const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY;
        const rawEnv = process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_ENV || "";
        const isProd = rawEnv.toUpperCase() === "PRODUCTION" || (secretKey && secretKey.includes("_prod_"));

        // Special Action: Resend Confirmation Email
        if (req.body?.action === "resend-email") {
            const targetId = req.body?.orderId || req.body?.orderNumber;
            let foundSnap = null;
            if (targetId) {
                const direct = await getDoc(doc(db, "orders", targetId));
                if (direct.exists()) foundSnap = direct;
                else {
                    const byNum = await getDocs(query(collection(db, "orders"), where("orderNumber", "==", targetId)));
                    if (!byNum.empty) foundSnap = byNum.docs[0];
                }
            }
            if (!foundSnap) {
                return res.status(404).json({ error: "Order not found." });
            }
            const oData = { id: foundSnap.id, ...foundSnap.data() };
            const emailRes = await sendOrderEmails({
                ...oData,
                orderId: foundSnap.id,
                orderNumber: oData.orderNumber
            });
            await updateDoc(doc(db, "orders", foundSnap.id), { emailStatus: emailRes });
            return res.status(200).json({ success: true, emailStatus: emailRes });
        }

        // Special Admin / Customer Claim Action by Payment ID (e.g. for past unlinked payments like 688991276)
        if (req.body?.action === "claim-payment" || (claimPaymentId && !cashfreeOrderId)) {
            const cleanPaymentId = String(claimPaymentId).trim();
            // Check if already claimed in Firestore
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

            // Create claimed order
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
                claimedManually: true
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
                    : (response?.data ? response.data : []);

                successfulPayment = paymentList.find(
                    p => String(p.paymentStatus || p.payment_status || "").toUpperCase() === "SUCCESS"
                );

                if (successfulPayment) {
                    cfPaymentId = successfulPayment.cfPaymentId || successfulPayment.cf_payment_id || cashfreeOrderId;
                }
            } catch (gatewayErr) {
                console.error("[VerifyOrder] Cashfree Gateway error:", gatewayErr?.response?.data || gatewayErr.message);
            }
        } else {
            // Mock dev mode
            successfulPayment = { paymentStatus: "SUCCESS", cfPaymentId: `CF_MOCK_${Date.now()}` };
            cfPaymentId = successfulPayment.cfPaymentId;
        }

        if (!successfulPayment) {
            // Check if there are failed/pending payments
            const hasFailed = paymentList.some(p => ["FAILED", "USER_DROPPED", "CANCELLED"].includes(String(p.paymentStatus || p.payment_status).toUpperCase()));
            return res.status(400).json({
                success: false,
                paymentStatus: hasFailed ? "FAILED" : "PENDING",
                error: hasFailed ? "Payment was unsuccessful or cancelled by user." : "Payment status is pending verification."
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
            // Fallback: check by doc ID
            const directSnap = await getDoc(doc(db, "orders", cashfreeOrderId));
            if (directSnap.exists()) {
                orderDocSnap = directSnap;
            }
        }

        if (orderDocSnap) {
            const orderData = { id: orderDocSnap.id, ...orderDocSnap.data() };
            const orderDocId = orderDocSnap.id;

            if (orderData.paymentStatus !== "Paid") {
                const updates = {
                    paymentStatus: "Paid",
                    orderStatus: "confirmed",
                    paymentId: finalPaymentId,
                    paymentMethod: "Online Payment (Cashfree)",
                    paymentDetails: {
                        cashfreeOrderId,
                        cfPaymentId: finalPaymentId,
                        paymentStatus: "SUCCESS",
                        paymentTime: successfulPayment?.paymentCompletionTime || new Date().toISOString()
                    },
                    updatedAt: serverTimestamp()
                };

                // Deduct stock atomically inside a transaction
                try {
                    const orderItems = orderData.items || [];
                    if (orderItems.length > 0) {
                        await runTransaction(clientDb, async (transaction) => {
                            // Read all product docs inside transaction
                            const productSnaps = {};
                            for (const item of orderItems) {
                                const pid = String(item.productId || "").split("_")[0];
                                if (!pid) continue;
                                if (!productSnaps[pid]) {
                                    const pRef = doc(clientDb, "products", pid);
                                    productSnaps[pid] = { ref: pRef, snap: await transaction.get(pRef) };
                                }
                            }

                            // Deduct stock per item
                            for (const item of orderItems) {
                                const pid = String(item.productId || "").split("_")[0];
                                if (!pid) continue;
                                const { ref: pRef, snap: pSnap } = productSnaps[pid] || {};
                                if (!pRef || !pSnap?.exists()) continue;

                                const pData = pSnap.data();
                                const qty = Number(item.quantity || 1);
                                const selectedSize = item.size || item.selectedSize || null;

                                if (selectedSize && Array.isArray(pData.sizeVariants) && pData.sizeVariants.length > 0) {
                                    const variantIdx = pData.sizeVariants.findIndex(v => v.size === selectedSize);
                                    if (variantIdx > -1) {
                                        const updatedVariants = pData.sizeVariants.map((v, i) =>
                                            i === variantIdx
                                                ? { ...v, stock: Math.max(0, Number(v.stock ?? 0) - qty) }
                                                : v
                                        );
                                        transaction.update(pRef, { sizeVariants: updatedVariants, updatedAt: serverTimestamp() });
                                    }
                                } else {
                                    transaction.update(pRef, {
                                        stock: Math.max(0, Number(pData.stock ?? 0) - qty),
                                        updatedAt: serverTimestamp()
                                    });
                                }
                            }

                            // Confirm the order within the same transaction
                            transaction.update(doc(clientDb, "orders", orderDocId), updates);
                        });
                        console.log(`[VerifyOrder] Stock deducted for order ${orderData.orderNumber}`);
                    } else {
                        // No items (orphan recovery), just update the order
                        await updateDoc(doc(db, "orders", orderDocId), updates);
                    }
                } catch (stockErr) {
                    console.error("[VerifyOrder] Stock deduction transaction error:", stockErr.message);
                    // Fallback: still update order status even if stock deduction fails
                    await updateDoc(doc(db, "orders", orderDocId), updates);
                }

                if (orderData.userId) {
                    try {
                        await updateDoc(doc(db, "users", orderData.userId, "orders", orderDocId), updates);
                    } catch (e) {}
                }

                // Dispatch Courier Manifest & Emails
                try {
                    const fullOrderSnapshot = { ...orderData, ...updates };

                    // 1. Send Order Confirmation Email
                    try {
                        const emailResult = await sendOrderEmails({
                            ...fullOrderSnapshot,
                            orderId: orderDocId,
                            orderNumber: orderData.orderNumber,
                            createdAt: new Date().toISOString()
                        });
                        await updateDoc(doc(db, "orders", orderDocId), { emailStatus: emailResult });
                        updates.emailStatus = emailResult;
                    } catch (emailErr) {
                        console.error("[VerifyOrder] Email dispatch error:", emailErr.message);
                    }

                    // 2. Dispatch Courier Shipment with iThink Logistics
                    createOrderShipment(fullOrderSnapshot).then(async (shipRes) => {
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
                    }).catch(err => console.error("[VerifyOrder] iThink dispatch error:", err.message));
                } catch (bgErr) {
                    console.warn("[VerifyOrder] Background tasks warning:", bgErr.message);
                }

                return res.status(200).json({
                    success: true,
                    verified: true,
                    orderId: orderDocId,
                    orderNumber: orderData.orderNumber,
                    paymentId: finalPaymentId,
                    order: { ...orderData, ...updates }
                });
            }

            // Already paid: ensure confirmation email is sent if previously pending/failed
            if (!orderData.emailStatus || orderData.emailStatus?.customer !== "sent") {
                try {
                    const emailResult = await sendOrderEmails({
                        ...orderData,
                        orderId: orderDocId,
                        orderNumber: orderData.orderNumber,
                        createdAt: orderData.createdAt || new Date().toISOString()
                    });
                    await updateDoc(doc(db, "orders", orderDocId), { emailStatus: emailResult });
                    orderData.emailStatus = emailResult;
                } catch (e) {
                    console.error("[VerifyOrder] Existing order email send error:", e.message);
                }
            }

            return res.status(200).json({
                success: true,
                verified: true,
                orderId: orderDocId,
                orderNumber: orderData.orderNumber,
                paymentId: orderData.paymentId || finalPaymentId,
                order: orderData
            });
        }

        // If order document was not found (orphan recovery)
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
            updatedAt: serverTimestamp()
        };

        await setDoc(newOrderRef, recoveredOrder);

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
