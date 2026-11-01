import {
  clientDb,
  adminDb,
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  serverTimestamp
} from "./firebaseServer.js";

/**
 * Validates stock availability for an array of order items before order creation/payment.
 * Does NOT mutate database state.
 * Throws an Error with code and user-friendly message if stock is insufficient.
 *
 * @param {import("firebase/firestore").Firestore} db
 * @param {Array<{ productId: string, quantity: number, size?: string, selectedSize?: string, name?: string }>} items
 * @returns {Promise<{ valid: boolean, itemsChecked: number }>}
 */
export async function validateStockAvailability(db = clientDb, items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No items provided for stock validation.");
  }

  // Aggregate quantities required per product and size
  const itemDemands = new Map();

  for (const rawItem of items) {
    const rawId = String(rawItem.productId || rawItem.id || "");
    if (!rawId) continue;
    const baseId = rawId.split("_")[0];
    const size = (rawItem.size || rawItem.selectedSize || "").trim().toUpperCase() || null;
    const qty = Math.max(1, Number(rawItem.quantity || 1));

    const key = `${baseId}::${size || "FLAT"}`;
    const current = itemDemands.get(key) || {
      productId: baseId,
      size,
      quantity: 0,
      name: rawItem.name || rawItem.productName || baseId
    };
    current.quantity += qty;
    itemDemands.set(key, current);
  }

  // Check each product
  for (const demand of itemDemands.values()) {
    const pRef = doc(db, "products", demand.productId);
    const pSnap = await getDoc(pRef);

    if (!pSnap.exists()) {
      throw new Error(`Product "${demand.name}" is no longer available in our catalog.`);
    }

    const pData = pSnap.data();

    if (pData.status === "Draft" || pData.visibility === "Private") {
      throw new Error(`Product "${pData.name || demand.name}" is currently unavailable.`);
    }

    let availableStock = 0;

    if (demand.size && Array.isArray(pData.sizeVariants) && pData.sizeVariants.length > 0) {
      const variant = pData.sizeVariants.find(
        (v) => String(v.size || "").trim().toUpperCase() === demand.size
      );
      if (variant) {
        availableStock = Number(variant.stock !== undefined && variant.stock !== null ? variant.stock : 0);
      } else {
        // If variant size not found in sizeVariants, fall back to base stock
        availableStock = Number(pData.stock !== undefined && pData.stock !== null ? pData.stock : 0);
      }
    } else {
      availableStock = Number(pData.stock !== undefined && pData.stock !== null ? pData.stock : 0);
    }

    if (availableStock < demand.quantity) {
      const sizeLabel = demand.size ? ` (Size: ${demand.size})` : "";
      const err = new Error(
        `Insufficient stock for "${pData.name || demand.name}"${sizeLabel}. Only ${availableStock} left in stock, but ${demand.quantity} was requested.`
      );
      err.code = "INSUFFICIENT_STOCK";
      err.availableStock = availableStock;
      err.requestedQuantity = demand.quantity;
      err.productName = pData.name || demand.name;
      throw err;
    }
  }

  return { valid: true, itemsChecked: itemDemands.size };
}

/**
 * Concurrency-safe, atomic inventory deduction for a confirmed order.
 * - Enforces order-level idempotency (never deducts twice for the same order).
 * - Reads all relevant product docs inside a Firestore transaction.
 * - Atomically verifies stock availability; rejects overselling with complete rollback.
 * - Decrements both variant stock and base product stock.
 * - Updates product stock_status ("In Stock" | "Out of Stock") and status.
 * - Records inventoryDeducted: true on the order document.
 *
 * @param {import("firebase/firestore").Firestore} db
 * @param {string} orderId
 * @param {Array<{ productId: string, quantity: number, size?: string, selectedSize?: string, name?: string }>} items
 * @param {string|null} userId
 * @returns {Promise<{ success: boolean, alreadyDeducted: boolean, updatedProducts: Array<{ id: string, newStock: number }> }>}
 */
export async function deductOrderInventory(db = clientDb, orderId, items = [], userId = null) {
  if (!orderId) {
    throw new Error("[InventoryService] Missing orderId for inventory deduction.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    console.warn(`[InventoryService] Order ${orderId} has no items to deduct stock for.`);
    return { success: true, alreadyDeducted: false, updatedProducts: [] };
  }

  // Aggregate quantity per product and per variant
  const itemDemands = new Map();
  const productIds = new Set();

  for (const rawItem of items) {
    const rawId = String(rawItem.productId || rawItem.id || "");
    if (!rawId) continue;
    const baseId = rawId.split("_")[0];
    productIds.add(baseId);

    const size = (rawItem.size || rawItem.selectedSize || "").trim().toUpperCase() || null;
    const qty = Math.max(1, Number(rawItem.quantity || 1));

    const key = `${baseId}::${size || "FLAT"}`;
    const current = itemDemands.get(key) || {
      productId: baseId,
      size,
      quantity: 0,
      name: rawItem.name || rawItem.productName || baseId
    };
    current.quantity += qty;
    itemDemands.set(key, current);
  }

  const orderRef = doc(db, "orders", orderId);

  // Execute in Firestore transaction to ensure concurrency safety
  return await runTransaction(db, async (transaction) => {
    // ── STEP 1: ALL READS FIRST (Firestore Rule) ──

    // Read order doc to verify idempotency
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) {
      throw new Error(`[InventoryService] Order document ${orderId} not found.`);
    }

    const orderData = orderSnap.data();

    // IDEMPOTENCY GUARD: If stock has already been deducted for this order, return cleanly
    if (orderData.inventoryDeducted === true) {
      console.log(`[InventoryService] Idempotency notice: Stock already deducted for order ${orderId}. Skipping duplicate deduction.`);
      return {
        success: true,
        alreadyDeducted: true,
        updatedProducts: []
      };
    }

    // Read all required product documents
    const productDocsMap = new Map();
    for (const pid of productIds) {
      const pRef = doc(db, "products", pid);
      const pSnap = await transaction.get(pRef);
      if (!pSnap.exists()) {
        throw new Error(`[InventoryService] Product ${pid} not found in database during checkout confirmation.`);
      }
      productDocsMap.set(pid, { ref: pRef, data: pSnap.data() });
    }

    // ── STEP 2: VERIFY AVAILABILITY & CALCULATE NEW STOCKS ──
    const productUpdates = new Map();

    for (const pid of productIds) {
      const { ref: pRef, data: pData } = productDocsMap.get(pid);

      // Deep clone sizeVariants array if present
      let updatedVariants = Array.isArray(pData.sizeVariants)
        ? pData.sizeVariants.map((v) => ({ ...v }))
        : null;

      let currentBaseStock = Number(pData.stock !== undefined && pData.stock !== null ? pData.stock : 0);
      let totalQtyDeductedForProduct = 0;

      // Find all demands targeting this product
      for (const demand of itemDemands.values()) {
        if (demand.productId !== pid) continue;

        if (demand.size && updatedVariants && updatedVariants.length > 0) {
          const vIdx = updatedVariants.findIndex(
            (v) => String(v.size || "").trim().toUpperCase() === demand.size
          );

          if (vIdx > -1) {
            const v = updatedVariants[vIdx];
            const currentVariantStock = Number(v.stock !== undefined && v.stock !== null ? v.stock : 0);

            if (currentVariantStock < demand.quantity) {
              const err = new Error(
                `INSUFFICIENT_STOCK: Product "${pData.name || demand.name}" (Size: ${demand.size}) only has ${currentVariantStock} available, but ${demand.quantity} was requested.`
              );
              err.code = "INSUFFICIENT_STOCK";
              err.productId = pid;
              err.productName = pData.name;
              throw err;
            }

            v.stock = Math.max(0, currentVariantStock - demand.quantity);
            totalQtyDeductedForProduct += demand.quantity;
          } else {
            // Variant size not defined in sizeVariants: fallback to base stock
            if (currentBaseStock < demand.quantity) {
              const err = new Error(
                `INSUFFICIENT_STOCK: Product "${pData.name || demand.name}" only has ${currentBaseStock} available, but ${demand.quantity} was requested.`
              );
              err.code = "INSUFFICIENT_STOCK";
              err.productId = pid;
              err.productName = pData.name;
              throw err;
            }
            currentBaseStock = Math.max(0, currentBaseStock - demand.quantity);
            totalQtyDeductedForProduct += demand.quantity;
          }
        } else {
          // Flat stock product
          if (currentBaseStock < demand.quantity) {
            const err = new Error(
              `INSUFFICIENT_STOCK: Product "${pData.name || demand.name}" only has ${currentBaseStock} available, but ${demand.quantity} was requested.`
            );
            err.code = "INSUFFICIENT_STOCK";
            err.productId = pid;
            err.productName = pData.name;
            throw err;
          }
          currentBaseStock = Math.max(0, currentBaseStock - demand.quantity);
          totalQtyDeductedForProduct += demand.quantity;
        }
      }

      // Recompute final base stock:
      // If product has size variants, base stock is the sum of variant stocks
      let finalStock = currentBaseStock;
      if (updatedVariants && updatedVariants.length > 0) {
        finalStock = updatedVariants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
      }

      const newStockStatus = finalStock <= 0 ? "Out of Stock" : "In Stock";
      const newStatus = finalStock <= 0
        ? "Out of Stock"
        : (pData.status === "Draft" ? "Draft" : "Published");

      const updatePayload = {
        stock: finalStock,
        stock_status: newStockStatus,
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      if (updatedVariants) {
        updatePayload.sizeVariants = updatedVariants;
      }

      productUpdates.set(pid, {
        ref: pRef,
        payload: updatePayload,
        newStock: finalStock
      });
    }

    // ── STEP 3: ALL WRITES AFTER READS ──
    const updatedProductsResult = [];

    for (const [pid, { ref, payload, newStock }] of productUpdates.entries()) {
      transaction.update(ref, payload);
      updatedProductsResult.push({ id: pid, newStock });
    }

    // Set idempotency flag and timestamp on the order document
    transaction.update(orderRef, {
      inventoryDeducted: true,
      inventoryDeductedAt: serverTimestamp()
    });

    // Also update user's copy of order if userId provided
    const targetUserId = userId || orderData.userId;
    if (targetUserId && targetUserId !== "guest") {
      const userOrderRef = doc(db, "users", targetUserId, "orders", orderId);
      transaction.update(userOrderRef, {
        inventoryDeducted: true,
        inventoryDeductedAt: serverTimestamp()
      });
    }

    console.log(
      `[InventoryService] Successfully decremented inventory for order ${orderId}:`,
      updatedProductsResult
    );

    return {
      success: true,
      alreadyDeducted: false,
      updatedProducts: updatedProductsResult
    };
  });
}

/**
 * Concurrency-safe, atomic inventory restoration for a cancelled or refunded order.
 * - Only restores if inventory was previously deducted (`inventoryDeducted === true`).
 * - Prevents multiple restorations.
 *
 * @param {import("firebase/firestore").Firestore} db
 * @param {string} orderId
 * @returns {Promise<{ success: boolean, alreadyRestored: boolean }>}
 */
export async function restoreOrderInventory(db = clientDb, orderId) {
  if (!orderId) throw new Error("[InventoryService] Missing orderId for inventory restoration.");

  const orderRef = doc(db, "orders", orderId);

  return await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) return { success: false, error: "Order not found" };

    const orderData = orderSnap.data();
    if (!orderData.inventoryDeducted) {
      return { success: true, alreadyRestored: true, message: "Inventory was never deducted." };
    }
    if (orderData.inventoryRestored === true) {
      return { success: true, alreadyRestored: true, message: "Inventory was already restored." };
    }

    const items = orderData.items || [];
    for (const item of items) {
      const rawId = String(item.productId || item.id || "");
      if (!rawId) continue;
      const baseId = rawId.split("_")[0];
      const pRef = doc(db, "products", baseId);
      const pSnap = await transaction.get(pRef);
      if (!pSnap.exists()) continue;

      const pData = pSnap.data();
      const qty = Math.max(1, Number(item.quantity || 1));
      const size = (item.size || item.selectedSize || "").trim().toUpperCase() || null;

      let updatedVariants = Array.isArray(pData.sizeVariants)
        ? pData.sizeVariants.map((v) => ({ ...v }))
        : null;

      let currentBaseStock = Number(pData.stock || 0);

      if (size && updatedVariants && updatedVariants.length > 0) {
        const v = updatedVariants.find((v) => String(v.size || "").trim().toUpperCase() === size);
        if (v) {
          v.stock = Number(v.stock || 0) + qty;
        } else {
          currentBaseStock += qty;
        }
      } else {
        currentBaseStock += qty;
      }

      let finalStock = currentBaseStock;
      if (updatedVariants && updatedVariants.length > 0) {
        finalStock = updatedVariants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
      }

      const updatePayload = {
        stock: finalStock,
        stock_status: finalStock > 0 ? "In Stock" : "Out of Stock",
        status: finalStock > 0 && pData.status === "Out of Stock" ? "Published" : pData.status,
        updatedAt: serverTimestamp()
      };
      if (updatedVariants) updatePayload.sizeVariants = updatedVariants;

      transaction.update(pRef, updatePayload);
    }

    transaction.update(orderRef, {
      inventoryRestored: true,
      inventoryRestoredAt: serverTimestamp()
    });

    return { success: true, alreadyRestored: false };
  });
}
