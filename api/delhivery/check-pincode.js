import { checkRateAndServiceability } from "../_lib/ithinkLogistics.js";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const pincode = req.query.pincode || (req.body && req.body.pincode);

    if (!pincode) {
      return res.status(400).json({ error: "Pincode is required." });
    }

    // Check with iThink Logistics
    const result = await checkRateAndServiceability({ pincode });

    return res.status(200).json({
      delivery_codes: [
        {
          postal_code: {
            pin: pincode,
            pre_paid: "Y",
            cash: "Y",
            pickup: "Y",
            cod: "Y"
          }
        }
      ],
      is_serviceable: result.isServiceable,
      expected_delivery_date: result.expectedDays,
      minEdd: result.minEdd,
      maxEdd: result.maxEdd,
      couriers: result.couriers || []
    });
  } catch (err) {
    console.error("[DelhiveryPincode] Error:", err);
    return res.status(200).json({
      is_serviceable: true,
      delivery_codes: [{ postal_code: { pin: req.query.pincode, pre_paid: "Y", cod: "Y" } }]
    });
  }
}
