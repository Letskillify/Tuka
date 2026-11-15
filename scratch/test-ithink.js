import fetch from "node-fetch"; // or global fetch in Node 18+

const ACCESS_TOKEN = "8c449c49ce133d6deff9a083e5cccf15";
const SECRET_KEY = "80c1a0f1161c88f9643bda2310b595b4";
const STORE_ID = "34522";
const PICKUP_ADDRESS_ID = "127493";

async function testRate() {
  console.log("=== Testing iThink Rate Check ===");
  const payload = {
    data: {
      from_pincode: "401303",
      to_pincode: "700001",
      shipping_length_cms: "25",
      shipping_width_cms: "20",
      shipping_height_cms: "5",
      shipping_weight_kg: "0.5",
      order_type: "forward",
      payment_method: "prepaid",
      product_mrp: "2000",
      access_token: ACCESS_TOKEN,
      secret_key: SECRET_KEY
    }
  };

  try {
    const res = await fetch("https://my.ithinklogistics.com/api_v3/rate/check.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Rate Check Status:", res.status);
    console.log("Rate Check Result:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Rate Check Error:", e);
  }
}

async function testOrderAdd() {
  console.log("\n=== Testing iThink Order Add ===");
  const testOrderNum = "TEST-" + Date.now();
  const payload = {
    data: {
      shipments: [
        {
          waybill: "",
          order: testOrderNum,
          sub_order: "",
          order_date: "15-11-2026",
          total_amount: "1500.00",
          name: "Test Customer",
          company_name: "",
          add: "Flat 101, Test Road",
          add2: "Salt Lake",
          add3: "",
          pin: "700001",
          city: "Kolkata",
          state: "West Bengal",
          country: "India",
          phone: "9876543210",
          alt_phone: "",
          email: "test@example.com",
          is_billing_same_as_shipping: "yes",
          billing_name: "Test Customer",
          billing_company_name: "",
          billing_add: "Flat 101, Test Road",
          billing_add2: "Salt Lake",
          billing_add3: "",
          billing_pin: "700001",
          billing_city: "Kolkata",
          billing_state: "West Bengal",
          billing_country: "India",
          billing_phone: "9876543210",
          billing_alt_phone: "",
          billing_email: "test@example.com",
          products: [
            {
              product_name: "Bengal Saree",
              product_sku: "SKU-001",
              product_quantity: "1",
              product_price: "1500.00",
              product_tax_rate: "5",
              product_hsn_code: "5208",
              product_discount: "0"
            }
          ],
          shipment_length: "25",
          shipment_width: "20",
          shipment_height: "5",
          weight: "0.50",
          shipping_charges: "0",
          giftwrap_charges: "0",
          transaction_charges: "0",
          total_discount: "0",
          first_attemp_discount: "0",
          cod_charges: "0",
          advance_amount: "1500.00",
          cod_amount: "0",
          payment_mode: "Prepaid",
          reseller_name: "",
          eway_bill_number: "",
          gst_number: "",
          what3words: "",
          return_address_id: "127493",
          api_source: "1",
          store_id: "34522"
        }
      ],
      pickup_address_id: "127493",
      access_token: ACCESS_TOKEN,
      secret_key: SECRET_KEY,
      logistics: "",
      s_type: "",
      order_type: ""
    }
  };

  try {
    const res = await fetch("https://my.ithinklogistics.com/api_v3/order/add.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Order Add Status:", res.status);
    console.log("Order Add Result:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Order Add Error:", e);
  }
}

async function run() {
  await testRate();
  await testOrderAdd();
}

run();

