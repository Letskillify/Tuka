import { checkRateAndServiceability } from "../_lib/ithinkLogistics.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queryParams = req.query || {};
    const bodyParams = req.body || {};

    const pincode = queryParams.pincode || bodyParams.pincode;
    const paymentMethod = queryParams.paymentMethod || bodyParams.paymentMethod || "prepaid";
    const weight = queryParams.weight || bodyParams.weight || 0.5;
    const orderTotal = queryParams.orderTotal || bodyParams.orderTotal || 2000;

    if (!pincode) {
      return res.status(400).json({ error: "Pincode is required." });
    }

    const result = await checkRateAndServiceability({
      pincode,
      paymentMethod,
      weight,
      orderTotal
    });

    // Provide both camelCase and snake_case for complete backward compatibility
    return res.status(200).json({
      ...result,
      is_serviceable: result.isServiceable
    });
  } catch (err) {
    console.error("[iThinkPincodeEndpoint] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to check pincode serviceability." });
  }
}
