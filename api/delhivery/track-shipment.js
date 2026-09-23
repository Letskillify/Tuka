export default async function handler(req, res) {
    if (req.method !== "POST" && req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const waybill = req.query.waybill || (req.body && req.body.waybill) || '';
        const ref_ids = req.query.ref_ids || (req.body && req.body.ref_ids) || '';

        if (!waybill && !ref_ids) {
            return res.status(400).json({ error: "Either waybill or order ID (ref_ids) is required." });
        }

        const token = process.env.DELHIVERY_TOKEN;
        const environment = process.env.DELHIVERY_ENV || "staging";

        const baseUrl = environment === "production"
            ? "https://track.delhivery.com"
            : "https://staging-express.delhivery.com";

        const url = `${baseUrl}/api/v1/packages/json/?waybill=${waybill}&ref_ids=${ref_ids}`;

        if (!token) {
            // Mock response
            return res.status(200).json({
                ShipmentData: [
                    {
                        Shipment: {
                            Status: {
                                Status: "In Transit",
                                StatusDateTime: new Date().toISOString()
                            },
                            AWB: waybill || "mock_waybill",
                            ReferenceNo: ref_ids
                        }
                    }
                ]
            });
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (err) {
        console.error("[DelhiveryTrack] Error:", err);
        return res.status(500).json({ error: err.message || "Failed to track shipment." });
    }
}
