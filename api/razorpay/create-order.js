import Razorpay from "razorpay";
import { clientDb, adminDb, doc, getDoc } from "../_lib/firebaseServer.js";

const getDb = () => adminDb || clientDb;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items, couponCode } = req.body || {};

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

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "rzp_test_1DP5mmOlF5G5ag";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;

    if (keySecret && !keySecret.startsWith("YOUR_")) {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(finalTotal * 100),
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: { itemCount: validatedItems.length }
      });

      return res.status(200).json({
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        subtotal: calculatedSubtotal,
        discount,
        shipping,
        tax,
        total: finalTotal
      });
    }

    // Dev mode / Fallback without key secret
    return res.status(200).json({
      razorpayOrderId: `order_mock_${Date.now()}`,
      amount: Math.round(finalTotal * 100),
      currency: "INR",
      subtotal: calculatedSubtotal,
      discount,
      shipping,
      tax,
      total: finalTotal
    });
  } catch (err) {
    console.error("[RazorpayCreateOrder] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to initialize payment." });
  }
}
