import { getShippingLabel } from "../_lib/ithinkLogistics.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queryParams = req.query || {};
    const bodyParams = req.body || {};

    const awb = queryParams.awb || queryParams.awb_numbers || bodyParams.awb || bodyParams.awb_numbers;
    const pageSize = queryParams.pageSize || bodyParams.pageSize || "A4";

    if (!awb) {
      return res.status(400).json({ error: "AWB number is required." });
    }

    const result = await getShippingLabel(awb, pageSize);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[iThinkShippingLabelEndpoint] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch shipping label." });
  }
}
