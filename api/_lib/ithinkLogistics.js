import fs from "node:fs";
import path from "node:path";

// Ensure environment variables are loaded in local serverless execution
const loadEnvFallback = () => {
  if (process.env.ITHINK_ACCESS_TOKEN && process.env.ITHINK_SECRET_KEY) return;
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const eqIdx = trimmed.indexOf("=");
          const key = trimmed.substring(0, eqIdx).trim();
          let val = trimmed.substring(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  } catch (e) {
    console.error("[iThinkLogistics] Error reading .env fallback:", e);
  }
};

loadEnvFallback();

const getConfig = () => {
  loadEnvFallback();
  return {
    accessToken: process.env.ITHINK_ACCESS_TOKEN ,
    secretKey: process.env.ITHINK_SECRET_KEY,
    storeId: process.env.ITHINK_STORE_ID || "34522",
    pickupAddressId: process.env.ITHINK_PICKUP_ADDRESS_ID || "127493",
    returnAddressId: process.env.ITHINK_RETURN_ADDRESS_ID || "127493",
    originPincode: process.env.ITHINK_ORIGIN_PINCODE || "401303",
    apiBase: "https://my.ithinklogistics.com/api_v3",
    trackBase: "https://api.ithinklogistics.com/api_v3"
  };
};

/**
 * Format Date to DD-MM-YYYY as required by iThink Logistics API
 */
const formatDate = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Clean phone number to 10 digits
 */
const sanitizePhone = (phone) => {
  if (!phone) return "9876543210";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits.padEnd(10, "0");
};

/**
 * Create Forward Order Shipment in iThink Logistics
 * Called automatically after order placement or manually from Admin
 */
export async function createOrderShipment(order) {
  try {
    const config = getConfig();
    const addr = order.shippingAddress || {};
    const items = order.items || [];

    const orderNumber = String(order.orderNumber || order.id || `ORD-${Date.now()}`);
    const customerName = String(order.customerName || addr.fullName || "Valued Customer").trim();
    const customerPhone = sanitizePhone(order.customerPhone || addr.phone);
    const customerEmail = String(order.customerEmail || "customer@tuka.co.in").trim();

    // Calculate weight: ~0.50kg per saree/piece, min 0.5kg
    const totalItemsQty = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
    const calculatedWeight = Math.min(150, Math.max(0.5, totalItemsQty * 0.5)).toFixed(2);

    const totalAmount = Number(order.total || 0).toFixed(2);
    const isCod = (order.paymentMethod || "").toLowerCase().includes("cod") || order.paymentMethod === "Cash on Delivery (COD)";
    const paymentMode = isCod ? "COD" : "Prepaid";
    const codAmount = isCod ? totalAmount : "0";

    const mappedProducts = items.map((item, idx) => ({
      product_name: String(item.productName || item.name || `Handloom Saree ${idx + 1}`).slice(0, 100),
      product_sku: String(item.productId || `SKU-${idx + 1}`).slice(0, 50),
      product_quantity: String(item.quantity || 1),
      product_price: String(Number(item.unitPrice || item.price || 0).toFixed(2)),
      product_tax_rate: "5",
      product_hsn_code: "5208", // Handloom cotton textiles HSN
      product_discount: "0",
      product_img_url: item.productImage || item.image || ""
    }));

    if (mappedProducts.length === 0) {
      mappedProducts.push({
        product_name: "Bengal Handloom Traditional Saree",
        product_sku: "TUKA-SAREE",
        product_quantity: "1",
        product_price: totalAmount,
        product_tax_rate: "5",
        product_hsn_code: "5208",
        product_discount: "0",
        product_img_url: ""
      });
    }

    const streetAddress = [
      addr.houseNumber,
      addr.street || addr.address,
      addr.locality,
      addr.landmark
    ].filter(Boolean).join(", ") || "Bengal Handloom Hub, Hooghly";

    const payload = {
      data: {
        shipments: [
          {
            waybill: "",
            order: orderNumber,
            sub_order: "",
            order_date: formatDate(order.createdAt),
            total_amount: totalAmount,
            name: customerName,
            company_name: "",
            add: streetAddress.slice(0, 190),
            add2: (addr.locality || "").slice(0, 90),
            add3: (addr.landmark || "").slice(0, 90),
            pin: String(addr.pincode || "700001").trim(),
            city: String(addr.city || "Kolkata").trim(),
            state: String(addr.state || "West Bengal").trim(),
            country: "India",
            phone: customerPhone,
            alt_phone: sanitizePhone(addr.altPhone || ""),
            email: customerEmail,
            is_billing_same_as_shipping: "yes",
            billing_name: customerName,
            billing_company_name: "",
            billing_add: streetAddress.slice(0, 190),
            billing_add2: (addr.locality || "").slice(0, 90),
            billing_add3: (addr.landmark || "").slice(0, 90),
            billing_pin: String(addr.pincode || "700001").trim(),
            billing_city: String(addr.city || "Kolkata").trim(),
            billing_state: String(addr.state || "West Bengal").trim(),
            billing_country: "India",
            billing_phone: customerPhone,
            billing_alt_phone: sanitizePhone(addr.altPhone || ""),
            billing_email: customerEmail,
            products: mappedProducts,
            shipment_length: "25",
            shipment_width: "20",
            shipment_height: "5",
            weight: String(calculatedWeight),
            shipping_charges: "0",
            giftwrap_charges: "0",
            transaction_charges: "0",
            total_discount: String(Number(order.discount || 0).toFixed(2)),
            first_attemp_discount: "0",
            cod_charges: "0",
            advance_amount: isCod ? "0" : totalAmount,
            cod_amount: codAmount,
            payment_mode: paymentMode,
            reseller_name: "",
            eway_bill_number: "",
            gst_number: "",
            what3words: "",
            return_address_id: String(config.returnAddressId),
            api_source: "1",
            store_id: String(config.storeId)
          }
        ],
        pickup_address_id: String(config.pickupAddressId),
        access_token: config.accessToken,
        secret_key: config.secretKey,
        logistics: "", // Auto-assign best courier or left empty
        s_type: "",
        order_type: ""
      }
    };

    console.log(`[iThinkLogistics] Dispatching order ${orderNumber} to iThink Logistics...`);

    const response = await fetch(`${config.apiBase}/order/add.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log(`[iThinkLogistics] Order Add Response for ${orderNumber}:`, JSON.stringify(result));

    if (result.status === "success" || result.status_code === 200) {
      // Data object can be keyed by index e.g. data["1"] or data["0"] or array
      const shipmentData = result.data ? (result.data["1"] || result.data["0"] || Object.values(result.data)[0]) : null;

      if (shipmentData && shipmentData.waybill && (shipmentData.status === "Success" || shipmentData.status === "success" || shipmentData.status !== "error")) {
        const waybill = shipmentData.waybill || "";
        const trackingUrl = shipmentData.tracking_url || (waybill ? `https://ithinklogistics.trackshipment.in/${waybill}` : "");

        return {
          success: true,
          waybill,
          refnum: shipmentData.refnum || orderNumber,
          logisticName: shipmentData.logistic_name || "iThink Express Courier",
          trackingUrl,
          raw: result
        };
      } else {
        const remarkError = shipmentData?.remark || shipmentData?.message || result.html_message || result.message || "Courier assignment pending in iThink Logistics dashboard.";
        return {
          success: false,
          error: remarkError,
          raw: result
        };
      }
    }

    return {
      success: false,
      error: result.html_message || result.message || "Courier assignment pending in iThink Logistics dashboard.",
      raw: result
    };
  } catch (err) {
    console.error("[iThinkLogistics] createOrderShipment Error:", err);
    return {
      success: false,
      error: err.message || "Failed to communicate with iThink Logistics API."
    };
  }
}

/**
 * Track Shipment using iThink Logistics Live Tracking API
 */
export async function trackOrderShipment(awbNumber) {
  try {
    const config = getConfig();
    if (!awbNumber || String(awbNumber).trim() === "") {
      return { success: false, error: "AWB / Waybill number is required." };
    }

    const cleanAwb = String(awbNumber).trim();

    const payload = {
      data: {
        awb_number_list: cleanAwb,
        access_token: config.accessToken,
        secret_key: config.secretKey
      }
    };

    console.log(`[iThinkLogistics] Tracking AWB ${cleanAwb}...`);

    const response = await fetch(`${config.trackBase}/order/track.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status_code === 200 && result.data && result.data[cleanAwb]) {
      const info = result.data[cleanAwb];
      const scanDetails = Array.isArray(info.scan_details) ? info.scan_details : [];

      return {
        success: true,
        awb: cleanAwb,
        courier: info.logistic || "iThink Logistics",
        orderNumber: info.order_details?.order_number || "",
        currentStatus: info.current_status || "Manifested",
        statusCode: info.current_status_code || "UD",
        expectedDeliveryDate: info.expected_delivery_date || info.promise_delivery_date || null,
        lastScan: info.last_scan_details || null,
        scans: scanDetails.map((s) => ({
          status: s.status,
          statusCode: s.status_code,
          location: s.scan_location,
          dateTime: s.scan_date_time,
          remark: s.remark,
          reason: s.status_reason
        })),
        trackingUrl: `https://ithinklogistics.trackshipment.in/${cleanAwb}`,
        customer: info.customer_details || null,
        orderDateTime: info.order_date_time || null,
        raw: info
      };
    }

    return {
      success: false,
      awb: cleanAwb,
      error: result.message || "No airway bill records found yet. Consignment may be in manifest processing."
    };
  } catch (err) {
    console.error("[iThinkLogistics] trackOrderShipment Error:", err);
    return {
      success: false,
      error: err.message || "Failed to query tracking data from iThink Logistics."
    };
  }
}

/**
 * Check Real-time Rate, Courier Serviceability & Expected Delivery Date
 */
export async function checkRateAndServiceability({
  pincode,
  fromPincode = null,
  weight = 0.5,
  paymentMethod = "prepaid",
  orderTotal = 2000
}) {
  try {
    const config = getConfig();
    const destinationPin = String(pincode || "").trim();
    const originPin = String(fromPincode || config.originPincode || "700001").trim();

    if (!destinationPin || destinationPin.length !== 6) {
      return {
        isServiceable: false,
        error: "Please enter a valid 6-digit Indian Postal Pincode."
      };
    }

    const isCod = String(paymentMethod).toLowerCase().includes("cod");

    const payload = {
      data: {
        from_pincode: originPin,
        to_pincode: destinationPin,
        shipping_length_cms: "25",
        shipping_width_cms: "20",
        shipping_height_cms: "5",
        shipping_weight_kg: String(Math.max(0.5, Number(weight) || 0.5)),
        order_type: "forward",
        payment_method: isCod ? "cod" : "prepaid",
        product_mrp: String(Math.max(100, Number(orderTotal) || 2000)),
        access_token: config.accessToken,
        secret_key: config.secretKey
      }
    };

    const response = await fetch(`${config.apiBase}/rate/check.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.status === "success" && Array.isArray(result.data) && result.data.length > 0) {
      const activeCouriers = result.data.filter((c) => {
        if (isCod) return c.cod === "Y";
        return c.prepaid === "Y";
      });

      const isServiceable = activeCouriers.length > 0;
      const expectedDays = result.expected_delivery_date || "3 to 5 Days";

      return {
        isServiceable,
        pincode: destinationPin,
        expectedDays,
        minEdd: result.edd_date?.min_edd || null,
        maxEdd: result.edd_date?.max_edd || null,
        courierCount: activeCouriers.length,
        couriers: activeCouriers.map((c) => ({
          name: c.logistic_name,
          serviceType: c.service_type,
          tatDays: c.delivery_tat,
          prepaid: c.prepaid === "Y",
          cod: c.cod === "Y"
        }))
      };
    }

    return {
      isServiceable: false,
      pincode: destinationPin,
      error: result.html_message || "Delivery is currently unavailable for this destination pincode."
    };
  } catch (err) {
    console.error("[iThinkLogistics] checkRateAndServiceability Error:", err);
    // Safe graceful fallback for network disruptions
    return {
      isServiceable: true,
      pincode,
      expectedDays: "3 to 5 Days",
      fallback: true
    };
  }
}

/**
 * Generate Shipment Printable Label (PDF)
 */
export async function getShippingLabel(awbNumbers, pageSize = "A4") {
  try {
    const config = getConfig();
    const payload = {
      data: {
        awb_numbers: Array.isArray(awbNumbers) ? awbNumbers.join(",") : String(awbNumbers),
        page_size: pageSize,
        access_token: config.accessToken,
        secret_key: config.secretKey
      }
    };

    const response = await fetch(`${config.apiBase}/shipping/label.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return await response.json();
  } catch (err) {
    console.error("[iThinkLogistics] getShippingLabel Error:", err);
    return { status: "error", message: err.message };
  }
}

/**
 * Cancel Shipment in iThink Logistics
 */
export async function cancelShipment(awbNumbers) {
  try {
    const config = getConfig();
    const payload = {
      data: {
        awb_numbers: Array.isArray(awbNumbers) ? awbNumbers.join(",") : String(awbNumbers),
        access_token: config.accessToken,
        secret_key: config.secretKey
      }
    };

    const response = await fetch(`${config.apiBase}/order/cancel.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return await response.json();
  } catch (err) {
    console.error("[iThinkLogistics] cancelShipment Error:", err);
    return { status: "error", message: err.message };
  }
}
