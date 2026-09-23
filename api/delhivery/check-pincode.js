export default async function handler(req, res) {
    if (req.method !== "POST" && req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const pincode = req.query.pincode || (req.body && req.body.pincode);

        if (!pincode) {
            return res.status(400).json({ error: "Pincode is required." });
        }

        const token = process.env.DELHIVERY_TOKEN;
        const environment = process.env.DELHIVERY_ENV || "staging"; // "staging" or "production"

        const baseUrl = environment === "production"
            ? "https://track.delhivery.com"
            : "https://staging-express.delhivery.com";

        // B2C Pincode Serviceability
        const url = `${baseUrl}/c/api/pin-codes/json/?filter_codes=${pincode}`;

        if (!token) {
            // Mock response if token is missing
            return res.status(200).json({
                delivery_codes: [
                    {
                        postal_code: {
                            pin: pincode,
                            pre_paid: "Y",
                            cash: "Y",
                            pickup: "Y",
                            repl: "N",
                            cod: "Y",
                            is_oda: "N",
                            sort_code: "XXX",
                            state_code: "XX"
                        }
                    }
                ],
                is_serviceable: true
            });
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const data = await response.json();

        // If the API response delivery_codes is empty list, the pincode is non-serviceable (NSZ).
        const isServiceable = data?.delivery_codes?.length > 0;

        return res.status(200).json({
            ...data,
            is_serviceable: isServiceable
        });

    } catch (err) {
        console.error("[DelhiveryPincode] Error:", err);
        return res.status(500).json({ error: err.message || "Failed to check serviceability." });
    }
}
