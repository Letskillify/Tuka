import { Cashfree } from "cashfree-pg-sdk-nodejs";
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

        const db = getDb();
        let calculatedSubtotal = 0;
        const validatedItems = [];

        for (const rawItem of items) {
            const rawId = String(rawItem.productId || rawItem.id || "");
            if (!rawId) continue;

            const baseId = rawId.split("_")[0];
            const selectedSize = rawItem.size || rawItem.selectedSize || null;
            const qty = Math.max(1, Number(rawItem.quantity || 1));

            const pRef = doc(db, "products", baseId);
            const pSnap = await getDoc(pRef);

            if (!pSnap.exists()) {
                return res.status(400).json({ error: `Product "${rawItem.name || baseId}" no longer exists.` });
            }

            const pData = pSnap.data();

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

        const finalTotal = Math.max(1, calculatedSubtotal - discount); // Must be at least 1 INR

        const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID;
        const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.VITE_CASHFREE_SECRET_KEY;

        if (!appId || !secretKey || appId.startsWith("YOUR_")) {
            // Dev mode fallback
            return res.status(200).json({
                payment_session_id: `session_mock_${Date.now()}`,
                order_id: `order_mock_${Date.now()}`,
                amount: finalTotal,
                currency: "INR",
                subtotal: calculatedSubtotal, discount, total: finalTotal
            });
        }

        Cashfree.XClientId = appId;
        Cashfree.XClientSecret = secretKey;
        Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

        const request = {
            order_amount: finalTotal,
            order_currency: "INR",
            order_id: "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            customer_details: {
                customer_id: customerDetails?.id || "guest",
                customer_email: customerDetails?.email || "guest@tuka.com",
                customer_phone: customerDetails?.phone || "9999999999"
            }
        };

        const response = await Cashfree.PGCreateOrder("2023-08-01", request);

        return res.status(200).json({
            payment_session_id: response.data.payment_session_id,
            order_id: response.data.order_id,
            amount: finalTotal,
            currency: "INR",
            subtotal: calculatedSubtotal,
            discount,
            total: finalTotal
        });

    } catch (err) {
        console.error("[CashfreeCreateOrder] Error:", err);
        return res.status(500).json({ error: err.message || "Failed to initialize payment." });
    }
}
