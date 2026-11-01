// cashfree-pg-sdk-nodejs v2 — uses CFPaymentGateway, CFConfig, CFEnvironment
import {
    CFPaymentGateway,
    CFConfig,
    CFEnvironment,
    CFOrderRequest,
    CFCustomerDetails,
    CFOrderMeta
} from "cashfree-pg-sdk-nodejs";

import { clientDb, adminDb, doc, getDoc, setDoc, collection, serverTimestamp } from "../_lib/firebaseServer.js";

const generateOrderNumber = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomStr = "";
    for (let i = 0; i < 6; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ORD-${randomStr}`;
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const {
            items,
            couponCode,
            customerDetails,
            shippingAddress,
            userId,
            idempotencyKey,
            returnUrl: clientReturnUrl
        } = req.body || {};

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "No items provided in request." });
        }

        const db = clientDb;
        let calculatedSubtotal = 0;
        const validatedItems = [];

        for (const rawItem of items) {
            const rawId = String(rawItem.productId || rawItem.id || "");
            if (!rawId) continue;

            const baseId = rawId.split("_")[0];
            const selectedSize = rawItem.size || rawItem.selectedSize || null;
            const qty = Math.max(1, Number(rawItem.quantity || 1));

            let pData;
            let exists = false;

            if (adminDb) {
                const pSnap = await adminDb.collection("products").doc(baseId).get();
                exists = pSnap.exists;
                pData = pSnap.data();
            } else {
                let projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
                if (!projectId || projectId === "undefined") {
                    console.warn("No PROJECT_ID found, skipping product verification for DEV checkout.");
                    pData = { price: rawItem.price, stock: 100, status: "Active", name: rawItem.name, image: rawItem.image };
                    exists = true;
                } else {
                    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products/${baseId}`;
                    const resRest = await fetch(url);
                    if (resRest.ok) {
                        const json = await resRest.json();
                        if (json.fields) {
                            exists = true;
                            const parseVal = (v) => v.stringValue !== undefined ? v.stringValue : (v.integerValue !== undefined ? Number(v.integerValue) : (v.doubleValue !== undefined ? Number(v.doubleValue) : (v.booleanValue !== undefined ? v.booleanValue : null)));
                            pData = {};
                            for (const k in json.fields) {
                                pData[k] = parseVal(json.fields[k]);
                            }

                            if (json.fields.sizeVariants && json.fields.sizeVariants.arrayValue && json.fields.sizeVariants.arrayValue.values) {
                                pData.sizeVariants = json.fields.sizeVariants.arrayValue.values.map(val => {
                                    if (!val.mapValue) return null;
                                    const sv = {};
                                    for (const sk in val.mapValue.fields) {
                                        sv[sk] = parseVal(val.mapValue.fields[sk]);
                                    }
                                    return sv;
                                }).filter(Boolean);
                            }
                        }
                    }
                }
            }

            if (!exists) {
                return res.status(400).json({ error: `Product "${rawItem.name || baseId}" no longer exists.` });
            }

            if (pData.status === "Draft" || pData.visibility === "Private") {
                return res.status(400).json({ error: `Product "${pData.name}" is currently unavailable.` });
            }

            let unitPrice = Number(pData.price || rawItem.price || 0);
            let availableStock = pData.stock !== undefined && pData.stock !== null ? Number(pData.stock) : 0;

            if (selectedSize && Array.isArray(pData.sizeVariants) && pData.sizeVariants.length > 0) {
                const variant = pData.sizeVariants.find(
                    (v) => String(v.size || "").trim().toUpperCase() === String(selectedSize).trim().toUpperCase()
                );
                if (variant) {
                    unitPrice = Number(variant.price || pData.price || 0);
                    availableStock = variant.stock !== undefined && variant.stock !== null ? Number(variant.stock) : 0;
                }
            }

            if (availableStock < qty) {
                const sizeLabel = selectedSize ? ` (Size: ${selectedSize})` : "";
                return res.status(409).json({
                    error: `Insufficient stock for "${pData.name || rawItem.name || baseId}"${sizeLabel}. Available: ${availableStock}, Requested: ${qty}`,
                    code: "INSUFFICIENT_STOCK"
                });
            }

            const itemSubtotal = unitPrice * qty;
            calculatedSubtotal += itemSubtotal;

            validatedItems.push({
                productId: baseId,
                productName: pData.name || rawItem.name || "Bengal Handloom",
                productImage: pData.image || (pData.images && pData.images[0]) || rawItem.image || "",
                size: selectedSize,
                color: rawItem.color || null,
                quantity: qty,
                unitPrice,
                subtotal: itemSubtotal
            });
        }

        let discount = 0;
        const code = String(couponCode || "").toUpperCase().trim();
        if (code === "TUKA10") discount = calculatedSubtotal * 0.1;
        else if (code === "WELCOME20") discount = calculatedSubtotal * 0.2;
        else if (code === "GIFT500") discount = Math.min(500, calculatedSubtotal);

        const finalTotal = Math.max(1, calculatedSubtotal - discount);

        const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID;
        const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY;
        const rawEnv = process.env.CASHFREE_ENV || process.env.VITE_CASHFREE_ENV || "";
        const isProd = rawEnv.toUpperCase() === "PRODUCTION" || (secretKey && secretKey.includes("_prod_"));

        // Fallback origin
        let reqOrigin = "";
        try {
            if (req.headers.origin) reqOrigin = req.headers.origin;
            else if (req.headers.referer) reqOrigin = new URL(req.headers.referer).origin;
        } catch (e) {}
        const effectiveOrigin = reqOrigin || "https://tuka.co.in";
        const returnUrl = clientReturnUrl || `${effectiveOrigin}/orders?cf_order_id={order_id}`;

        if (!appId || !secretKey || appId.startsWith("YOUR_")) {
            // Dev mode fallback — no real keys configured
            return res.status(200).json({
                payment_session_id: `session_mock_${Date.now()}`,
                order_id: `order_mock_${Date.now()}`,
                internal_order_id: `ord_doc_mock_${Date.now()}`,
                order_number: generateOrderNumber(),
                env_mode: "sandbox",
                amount: finalTotal,
                currency: "INR",
                subtotal: calculatedSubtotal,
                discount,
                total: finalTotal
            });
        }

        // Build CFConfig for cashfree-pg-sdk-nodejs v2
        const cfEnvironment = isProd ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
        const cfConfig = new CFConfig(cfEnvironment, "2023-08-01", appId, secretKey);

        // Build customer details
        const rawCustomerId = customerDetails?.id || customerDetails?.email || "guest_" + Date.now();
        const sanitizedCustId = String(rawCustomerId).replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 45);
        const rawPhone = String(customerDetails?.phone || "").replace(/\D/g, "");
        const sanitizedPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : "9999999999";

        const cfCustomer = new CFCustomerDetails();
        cfCustomer.customerId = sanitizedCustId;
        cfCustomer.customerEmail = customerDetails?.email || "guest@tuka.com";
        cfCustomer.customerPhone = sanitizedPhone;

        // Build order request with return_url meta
        const cashfreeOrderId = "ORD_CF_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        const cfOrderReq = new CFOrderRequest();
        cfOrderReq.orderId = cashfreeOrderId;
        cfOrderReq.orderAmount = finalTotal;
        cfOrderReq.orderCurrency = "INR";
        cfOrderReq.customerDetails = cfCustomer;

        const cfOrderMeta = new CFOrderMeta();
        cfOrderMeta.returnUrl = returnUrl;
        cfOrderReq.orderMeta = cfOrderMeta;

        // Create order via v2 SDK
        const gateway = new CFPaymentGateway();
        const response = await gateway.orderCreate(cfConfig, cfOrderReq);

        const cfOrderRes = response?.cfOrder || response?.data || response;
        const generatedCfOrderId = cfOrderRes.orderId || cfOrderRes.order_id || cashfreeOrderId;
        const paymentSessionId = cfOrderRes.paymentSessionId || cfOrderRes.payment_session_id;

        // Pre-create Order Record in Firestore (so orders are NEVER lost if browser redirects!)
        const orderNumber = generateOrderNumber();
        const isGuestUser = !userId || userId === "guest";
        const finalUserId = isGuestUser ? null : userId;

        const newOrderRef = doc(collection(db, "orders"));
        const internalOrderId = newOrderRef.id;

        const fullShippingAddress = {
            fullName: customerDetails?.name || customerDetails?.fullName || "Valued Customer",
            phone: sanitizedPhone,
            altPhone: shippingAddress?.altPhone || "",
            houseNumber: shippingAddress?.houseNumber || "",
            street: shippingAddress?.street || shippingAddress?.address || "",
            locality: shippingAddress?.locality || "",
            landmark: shippingAddress?.landmark || "",
            city: shippingAddress?.city || "",
            state: shippingAddress?.state || "",
            pincode: shippingAddress?.pincode || "",
            addressType: shippingAddress?.addressType || "Home"
        };

        const initialOrderData = {
            orderId: internalOrderId,
            orderNumber,
            cashfreeOrderId: generatedCfOrderId,
            idempotencyKey: idempotencyKey || `cf_idemp_${Date.now()}`,
            userId: finalUserId,
            isGuest: isGuestUser,
            customerEmail: String(customerDetails?.email || "").trim().toLowerCase(),
            customerName: String(customerDetails?.name || "").trim(),
            customerPhone: sanitizedPhone,
            shippingAddress: fullShippingAddress,
            items: validatedItems,
            subtotal: calculatedSubtotal,
            discount,
            shipping: 0,
            tax: 0,
            total: finalTotal,
            currency: "INR",
            paymentMethod: "Online Payment (Cashfree)",
            paymentStatus: "Pending",
            orderStatus: "payment_pending",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            inventoryDeducted: false,
            emailStatus: { customer: "pending", admin: "pending" }
        };

        try {
            await setDoc(newOrderRef, initialOrderData);
            if (finalUserId) {
                const userOrderRef = doc(db, "users", finalUserId, "orders", internalOrderId);
                await setDoc(userOrderRef, initialOrderData);
            }
        } catch (dbErr) {
            console.warn("[CashfreeCreateOrder] Firestore direct save error (will fallback on REST/verify):", dbErr.message);
        }

        return res.status(200).json({
            payment_session_id: paymentSessionId,
            order_id: generatedCfOrderId,
            internal_order_id: internalOrderId,
            order_number: orderNumber,
            env_mode: isProd ? "production" : "sandbox",
            amount: finalTotal,
            currency: "INR",
            subtotal: calculatedSubtotal,
            discount,
            total: finalTotal
        });

    } catch (err) {
        console.error("[CashfreeCreateOrder] Error:", err?.response?.data || err.message || err);
        return res.status(500).json({ error: err?.response?.data?.message || err.message || "Failed to initialize payment." });
    }
}
