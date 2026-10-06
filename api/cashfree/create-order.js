// cashfree-pg-sdk-nodejs v2 — uses CFPaymentGateway, CFConfig, CFEnvironment
import {
    CFPaymentGateway,
    CFConfig,
    CFEnvironment,
    CFOrderRequest,
    CFCustomerDetails
} from "cashfree-pg-sdk-nodejs";

import { clientDb, adminDb, doc, getDoc } from "../_lib/firebaseServer.js";

const getDb = () => clientDb;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { items, couponCode, customerDetails } = req.body || {};

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "No items provided in request." });
        }

        const db = adminDb || clientDb;
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
                // Fallback to RAW REST API to avoid Node.js "Client Offline" socket errors
                let projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
                if (!projectId || projectId === "undefined") {
                    console.warn("No PROJECT_ID found, skipping product verification for DEV checkout.");
                    pData = { price: rawItem.price, stock: 100, status: "Active", name: rawItem.name };
                    exists = true;
                } else {
                    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products/${baseId}`;
                    const resRest = await fetch(url);
                    if (resRest.ok) {
                        const json = await resRest.json();
                        if (json.fields) {
                            exists = true;
                            // Parse basic fields
                            const parseVal = (v) => v.stringValue !== undefined ? v.stringValue : (v.integerValue !== undefined ? Number(v.integerValue) : (v.doubleValue !== undefined ? Number(v.doubleValue) : (v.booleanValue !== undefined ? v.booleanValue : null)));
                            pData = {};
                            for (const k in json.fields) {
                                pData[k] = parseVal(json.fields[k]);
                            }

                            // Parse sizeVariants array if present
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

            let unitPrice = Number(pData.price || 0);
            let availableStock = Number(pData.stock || 0);

            if (selectedSize && Array.isArray(pData.sizeVariants) && pData.sizeVariants.length > 0) {
                const variant = pData.sizeVariants.find((v) => v.size === selectedSize);
                if (!variant) {
                    return res.status(400).json({ error: `Size "${selectedSize}" is not available for product "${pData.name}".` });
                }
                unitPrice = Number(variant.price || pData.price || 0);
                availableStock = Number(variant.stock || 0);
            }

            if (availableStock < qty) {
                return res.status(409).json({
                    error: `Insufficient stock for "${pData.name}"${selectedSize ? ` (${selectedSize})` : ""}. Only ${availableStock} pieces available.`
                });
            }

            const itemSubtotal = unitPrice * qty;
            calculatedSubtotal += itemSubtotal;

            validatedItems.push({
                productId: baseId,
                size: selectedSize,
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

        if (!appId || !secretKey || appId.startsWith("YOUR_")) {
            // Dev mode fallback — no real keys configured
            return res.status(200).json({
                payment_session_id: `session_mock_${Date.now()}`,
                order_id: `order_mock_${Date.now()}`,
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

        // Build order request
        const cfOrderReq = new CFOrderRequest();
        cfOrderReq.orderId = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        cfOrderReq.orderAmount = finalTotal;
        cfOrderReq.orderCurrency = "INR";
        cfOrderReq.customerDetails = cfCustomer;

        // Create order via v2 SDK
        const gateway = new CFPaymentGateway();
        const response = await gateway.orderCreate(cfConfig, cfOrderReq);

        // v2 SDK response shape: { cfHeaders, cfOrder: CFOrder }
        // CFOrder fields are camelCase: paymentSessionId, orderId
        const cfOrderRes = response?.cfOrder || response?.data || response;

        return res.status(200).json({
            payment_session_id: cfOrderRes.paymentSessionId || cfOrderRes.payment_session_id,
            order_id: cfOrderRes.orderId || cfOrderRes.order_id,
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
