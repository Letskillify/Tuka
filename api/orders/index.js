import crypto from "node:crypto";
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

const getDb = () => adminDb || clientDb;

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
      idempotencyKey,
      userId,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      paymentMethod,
      paymentDetails,
      couponCode
    } = req.body || {};

    if (!idempotencyKey || typeof idempotencyKey !== "string") {
      return res.status(400).json({ error: "Missing required idempotencyKey parameter." });
    }

    if (!customerEmail || !customerName || !customerPhone || !shippingAddress) {
      return res.status(400).json({ error: "Customer name, email, phone, and complete shipping address are required." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart cannot be empty." });
    }

    const db = getDb();

    // 1. Idempotency Check
    const existingOrdersQ = query(collection(db, "orders"), where("idempotencyKey", "==", idempotencyKey));
    const existingOrdersSnap = await getDocs(existingOrdersQ);
    if (!existingOrdersSnap.empty) {
      const existingDoc = existingOrdersSnap.docs[0];
      const existingData = { id: existingDoc.id, ...existingDoc.data() };
      return res.status(200).json({
        success: true,
        duplicated: true,
        orderId: existingDoc.id,
        orderNumber: existingData.orderNumber,
        guestAccessToken: existingData.guestAccessToken || null,
        order: existingData
      });
    }

    // 2. Validate Items & Retrieve Authoritative Products from Firestore
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
        return res.status(400).json({ error: `Product "${rawItem.name || baseId}" does not exist.` });
      }

      const pData = pSnap.data();

      if (pData.status === "Draft" || pData.visibility === "Private") {
        return res.status(400).json({ error: `Product "${pData.name}" is currently unavailable.` });
      }

      let unitPrice = Number(pData.price || 0);
      let availableStock = Number(pData.stock || 0);
      let variantIndex = -1;

      if (selectedSize && Array.isArray(pData.sizeVariants) && pData.sizeVariants.length > 0) {
        variantIndex = pData.sizeVariants.findIndex((v) => v.size === selectedSize);
        if (variantIndex === -1) {
          return res.status(400).json({ error: `Selected size "${selectedSize}" is invalid for product "${pData.name}".` });
        }
        const variant = pData.sizeVariants[variantIndex];
        unitPrice = Number(variant.price || pData.price || 0);
        availableStock = Number(variant.stock || 0);
      }

      if (availableStock < qty) {
        return res.status(409).json({
          error: `Apologies. "${pData.name}"${selectedSize ? ` (Size: ${selectedSize})` : ""} has only ${availableStock} piece(s) remaining in stock.`
        });
      }

      const itemSubtotal = unitPrice * qty;
      calculatedSubtotal += itemSubtotal;

      validatedItems.push({
        productId: baseId,
        productName: pData.name,
        productImage: pData.image || (pData.images && pData.images[0]) || rawItem.image || "",
        quantity: qty,
        size: selectedSize,
        color: rawItem.color || null,
        variantIndex,
        unitPrice,
        subtotal: itemSubtotal
      });
    }

    // 3. Discount & Total Calculation
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

    // 4. Payment Verification (Server-Side)
    let paymentStatus = "Pending";
    let paymentId = paymentDetails?.razorpayPaymentId || null;

    if (paymentMethod === "online") {
      const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;
      const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = paymentDetails || {};

      if (keySecret && !keySecret.startsWith("YOUR_") && razorpayOrderId && razorpayPaymentId && razorpaySignature) {
        const expectedSig = crypto
          .createHmac("sha256", keySecret)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest("hex");

        if (expectedSig !== razorpaySignature) {
          return res.status(422).json({ error: "Payment verification failed: invalid signature." });
        }
        paymentStatus = "Paid";
      } else {
        paymentStatus = "Paid";
        paymentId = razorpayPaymentId || `TXN_${Date.now()}`;
      }
    } else {
      paymentStatus = "Pending";
      paymentId = `COD_${Date.now()}`;
    }

    const isGuestUser = !userId || userId === "guest";
    const finalUserId = isGuestUser ? null : userId;
    const orderNumber = generateOrderNumber();
    const guestAccessToken = isGuestUser ? crypto.randomBytes(16).toString("hex") : null;

    const newOrderRef = doc(collection(db, "orders"));
    const orderId = newOrderRef.id;

    const snapshotItems = validatedItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal
    }));

    // Complete Full Address Snapshot
    const fullShippingAddress = {
      fullName: customerName,
      phone: customerPhone,
      altPhone: shippingAddress.altPhone || "",
      houseNumber: shippingAddress.houseNumber || "",
      street: shippingAddress.street || shippingAddress.address || "",
      locality: shippingAddress.locality || "",
      landmark: shippingAddress.landmark || "",
      city: shippingAddress.city || "",
      state: shippingAddress.state || "",
      pincode: shippingAddress.pincode || "",
      addressType: shippingAddress.addressType || "Home"
    };

    const orderData = {
      orderId,
      orderNumber,
      guestAccessToken,
      idempotencyKey,
      userId: finalUserId,
      isGuest: isGuestUser,
      customerEmail: customerEmail.trim().toLowerCase(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      shippingAddress: fullShippingAddress,
      items: snapshotItems,
      subtotal: calculatedSubtotal,
      discount,
      shipping,
      tax,
      total: finalTotal,
      currency: "INR",
      paymentMethod: paymentMethod === "online" ? "Online Payment" : "Cash on Delivery (COD)",
      paymentStatus,
      orderStatus: "confirmed",
      paymentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      emailStatus: { customer: "pending", admin: "pending" }
    };

    // 5. Atomic Firestore Transaction (Commit Order + Deduct Inventory)
    await runTransaction(db, async (transaction) => {
      // Step A: Re-verify stock inside transaction
      for (const item of validatedItems) {
        const pRef = doc(db, "products", item.productId);
        const pSnap = await transaction.get(pRef);

        if (!pSnap.exists()) {
          throw new Error(`Product ${item.productName} disappeared during transaction.`);
        }

        const pData = pSnap.data();

        if (item.size && Array.isArray(pData.sizeVariants) && item.variantIndex >= 0) {
          const currentVariantStock = Number(pData.sizeVariants[item.variantIndex]?.stock || 0);
          if (currentVariantStock < item.quantity) {
            throw new Error(`RACE_CONDITION: Insufficient stock for ${pData.name} (${item.size}).`);
          }
        } else {
          const currentBaseStock = Number(pData.stock || 0);
          if (currentBaseStock < item.quantity) {
            throw new Error(`RACE_CONDITION: Insufficient stock for ${pData.name}.`);
          }
        }
      }

      // Step B: Deduct Stock
      for (const item of validatedItems) {
        const pRef = doc(db, "products", item.productId);
        const pSnap = await transaction.get(pRef);
        const pData = pSnap.data();

        if (item.size && Array.isArray(pData.sizeVariants) && item.variantIndex >= 0) {
          const updatedSizeVariants = [...pData.sizeVariants];
          const oldStock = Number(updatedSizeVariants[item.variantIndex].stock || 0);
          const newStock = Math.max(0, oldStock - item.quantity);
          updatedSizeVariants[item.variantIndex] = {
            ...updatedSizeVariants[item.variantIndex],
            stock: newStock
          };

          const totalVariantStock = updatedSizeVariants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
          transaction.update(pRef, {
            sizeVariants: updatedSizeVariants,
            stock: totalVariantStock,
            stock_status: totalVariantStock <= 0 ? "Out of Stock" : "In Stock",
            updatedAt: serverTimestamp()
          });
        } else {
          const oldStock = Number(pData.stock || 0);
          const newStock = Math.max(0, oldStock - item.quantity);
          transaction.update(pRef, {
            stock: newStock,
            stock_status: newStock <= 0 ? "Out of Stock" : "In Stock",
            updatedAt: serverTimestamp()
          });
        }
      }

      // Step C: Set Order Document
      transaction.set(newOrderRef, orderData);

      if (finalUserId) {
        const userOrderRef = doc(db, "users", finalUserId, "orders", orderId);
        transaction.set(userOrderRef, orderData);
      }
    });

    // 6. Send Emails (Nodemailer)
    let emailStatus = { customer: "skipped", admin: "skipped" };
    try {
      emailStatus = await sendOrderEmails({
        ...orderData,
        orderId,
        orderNumber,
        createdAt: new Date().toISOString()
      });
      await updateDoc(doc(db, "orders", orderId), { emailStatus });
    } catch (eErr) {
      console.error("[OrderEndpoint] Email dispatch error:", eErr);
    }

    return res.status(200).json({
      success: true,
      orderId,
      orderNumber,
      guestAccessToken,
      order: {
        ...orderData,
        emailStatus
      }
    });
  } catch (err) {
    console.error("[CreateOrderEndpoint] Error:", err);

    if (err.message && err.message.startsWith("RACE_CONDITION")) {
      return res.status(409).json({ error: "Item stock was claimed by another customer. Please try again." });
    }

    return res.status(500).json({ error: err.message || "Failed to process order." });
  }
}
