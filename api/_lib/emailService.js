import nodemailer from "nodemailer";
import fs from "node:fs";
import path from "node:path";

const loadEnvFallback = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return;
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
    console.error("[EmailService] Error reading .env fallback:", e);
  }
};

const formatCurrency = (amt) => "₹" + Number(amt || 0).toLocaleString("en-IN");

const formatOrderDate = (dateVal) => {
  if (!dateVal) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  try {
    let d;
    if (typeof dateVal === "object" && dateVal.toDate) {
      d = dateVal.toDate();
    } else if (typeof dateVal === "object" && dateVal.seconds) {
      d = new Date(dateVal.seconds * 1000);
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) d = new Date();
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (e) {
    return String(dateVal);
  }
};

export const generateCustomerEmailHtml = (order) => {
  const isPaid = String(order.paymentStatus || "").toLowerCase() === "paid";
  const orderNumber = order.orderNumber || order.orderId || "ORD-PENDING";
  const formattedDate = formatOrderDate(order.createdAt || order.orderDate);
  const customerEmail = String(order.customerEmail || (order.shippingAddress && order.shippingAddress.email) || "").trim();
  const baseUrl = (process.env.PUBLIC_APP_URL || process.env.VITE_APP_URL || process.env.APP_URL || "https://tuka.co.in").replace(/\/$/, "");
  const orderTarget = `/orders?orderNumber=${encodeURIComponent(orderNumber)}`;
  const viewOrderUrl = `${baseUrl}/login?email=${encodeURIComponent(customerEmail)}&redirect=${encodeURIComponent(orderTarget)}`;
  const orderUrl = viewOrderUrl;
  const trackingUrl = order.trackingUrl || (order.awbCode ? `https://ithinklogistics.trackshipment.in/${encodeURIComponent(order.awbCode)}` : viewOrderUrl);

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      productName: "Bengal Handloom Drape",
      quantity: 1,
      unitPrice: order.total || order.subtotal || 0,
      subtotal: order.total || order.subtotal || 0,
      productImage: "https://res.cloudinary.com/ewqgfmrg/image/upload/v1789393495/ubfrts0gynhfpvav4rgi.jpg"
    }
  ];

  const itemsHtml = items
    .map((item) => {
      const itemImg = item.productImage || item.image || "https://res.cloudinary.com/ewqgfmrg/image/upload/v1789393495/ubfrts0gynhfpvav4rgi.jpg";
      const itemName = item.productName || item.name || "Handloom Saree";
      const itemQty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice || item.price || 0);
      const lineTotal = Number(item.subtotal || (unitPrice * itemQty));
      const sizeBadge = item.size ? `<span style="display:inline-block; font-size:11px; font-weight:700; color:#b13896; background:#fdf2f8; border:1px solid #fbcfe8; border-radius:4px; padding:2px 7px; margin-top:4px;">Size: ${item.size}</span>` : "";
      const colorBadge = item.color ? `<span style="display:inline-block; font-size:11px; color:#6b7280; margin-left:6px;">Color: ${item.color}</span>` : "";

      return `
      <tr>
        <td style="padding: 16px 12px; border-bottom: 1px solid #f0e6ee; vertical-align: top; width: 64px;">
          <img src="${itemImg}" alt="${itemName}" width="58" height="72" style="width: 58px; height: 72px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; display: block;" />
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #f0e6ee; vertical-align: top; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
          <div style="font-weight: 700; color: #161114; font-size: 14px; line-height: 1.4;">${itemName}</div>
          <div>${sizeBadge}${colorBadge}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Unit Price: ${formatCurrency(unitPrice)}</div>
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #f0e6ee; vertical-align: top; text-align: center; font-size: 14px; font-weight: 600; color: #161114; font-family: Arial, sans-serif;">
          x${itemQty}
        </td>
        <td style="padding: 16px 12px; border-bottom: 1px solid #f0e6ee; vertical-align: top; text-align: right; font-weight: 700; color: #161114; font-size: 15px; font-family: Arial, sans-serif;">
          ${formatCurrency(lineTotal)}
        </td>
      </tr>
      `;
    })
    .join("");

  const addr = order.shippingAddress || {};
  const recipientName = order.customerName || addr.fullName || "Valued Patron";
  const customerPhone = order.customerPhone || addr.phone || "N/A";

  const addressFormatted = [
    addr.houseNumber ? `${addr.houseNumber}` : "",
    addr.street || addr.address || "",
    addr.locality ? `${addr.locality}` : "",
    addr.city ? `${addr.city}` : "",
    addr.state ? `${addr.state}` : "",
    addr.pincode ? `PIN: ${addr.pincode}` : ""
  ].filter(Boolean).join(", ");

  const subtotal = Number(order.subtotal || order.total || 0);
  const discount = Number(order.discount || 0);
  const shipping = Number(order.shipping || 0);
  const total = Number(order.total || (subtotal - discount + shipping));

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #${orderNumber} - Tuka Boutique</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .mobile-stack { display: block !important; width: 100% !important; text-align: left !important; }
      .mobile-space { height: 16px !important; }
      .mobile-padding { padding: 20px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F4EF; font-family: 'Plus Jakarta Sans', Arial, -apple-system, sans-serif; color: #161114; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F4EF; padding: 32px 8px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 35px rgba(0,0,0,0.06); max-width: 600px; width: 100%;">
          
          <!-- Header with Tuka Boutique Logo -->
          <tr>
            <td style="background-color: #161114; padding: 36px 24px 28px 24px; text-align: center;">
              <a href="https://tuka.co.in" target="_blank" style="text-decoration: none; display: inline-block;">
                <img src="cid:tukaLogo" alt="Tuka Boutique" width="180" style="display: block; margin: 0 auto; max-width: 180px; height: auto; border: 0;" onerror="this.onerror=null; this.src='https://tuka.co.in/img/Tuka-Logo.svg';" />
              </a>
              <div style="font-size: 24px; font-family: 'Playfair Display', Georgia, serif; color: #ffffff; letter-spacing: 4px; font-weight: 500; text-transform: uppercase; margin-top: 10px;">
                TUKA <span style="color: #f4cfeb; font-style: italic;">BOUTIQUE</span>
              </div>
              <div style="font-size: 10px; color: #e879f9; text-transform: uppercase; letter-spacing: 3px; margin-top: 6px; font-weight: 600;">
                Authentic Bengal Handlooms &amp; Couture
              </div>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td class="mobile-padding" style="padding: 36px 36px 20px 36px;">
              <div style="display: inline-block; background-color: ${isPaid ? '#ecfdf5' : '#fffbeb'}; border: 1px solid ${isPaid ? '#a7f3d0' : '#fde68a'}; border-radius: 9999px; padding: 5px 14px; margin-bottom: 14px;">
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${isPaid ? '#047857' : '#b45309'};">
                  ${isPaid ? '✓ Order Confirmed &amp; Payment Verified' : '✓ Order Confirmed (Cash on Delivery)'}
                </span>
              </div>
              <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 400; margin: 0 0 10px 0; color: #161114; line-height: 1.3;">
                Thank you for your order, ${recipientName}!
              </h1>
              <p style="font-size: 14px; color: #555; margin: 0; line-height: 1.6;">
                We are delighted to confirm your order. Master hereditary artisans in Bengal have registered your request and our atelier team is carefully preparing your handloom pieces for packaging and insured courier dispatch.
              </p>
            </td>
          </tr>

          <!-- Order Meta Card -->
          <tr>
            <td style="padding: 10px 36px 20px 36px;" class="mobile-padding">
              <table width="100%" cellpadding="16" cellspacing="0" style="background-color: #FDFBF9; border-radius: 14px; border: 1px solid #f0e6ee;">
                <tr>
                  <td class="mobile-stack" width="50%" style="vertical-align: top;">
                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888;">Order Number</div>
                    <div style="font-size: 17px; font-weight: 700; color: #b13896; font-family: monospace; margin-top: 3px;">#${orderNumber}</div>
                    <div style="font-size: 12px; color: #777; margin-top: 4px;">Placed on: ${formattedDate}</div>
                    <div style="font-size: 12px; color: #777; margin-top: 2px;">Status: <strong style="color: #161114; text-transform: capitalize;">${order.orderStatus || 'Confirmed'}</strong></div>
                  </td>
                  <td class="mobile-stack" width="50%" style="vertical-align: top; text-align: right;" align="right">
                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888;">Payment Verification</div>
                    <div style="font-size: 13px; font-weight: 700; color: #161114; margin-top: 3px;">
                      ${order.paymentMethod || (isPaid ? 'Online Payment (Cashfree)' : 'Cash on Delivery (COD)')}
                    </div>
                    <div style="margin-top: 5px;">
                      <span style="display: inline-block; background-color: ${isPaid ? '#dcfce7' : '#fef3c7'}; color: ${isPaid ? '#15803d' : '#92400e'}; border: 1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}; padding: 3px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px;">
                        ${isPaid ? 'PAID' : 'PENDING (COD)'}
                      </span>
                    </div>
                    ${order.bankReference ? `
                    <div style="font-size: 11px; color: #666; margin-top: 5px;">
                      Bank Ref / UTR: <strong style="font-family: monospace; color: #161114;">${order.bankReference}</strong>
                    </div>` : ''}
                    ${order.paymentId ? `
                    <div style="font-size: 11px; color: #666; margin-top: 2px;">
                      Payment ID: <span style="font-family: monospace;">${order.paymentId}</span>
                    </div>` : ''}
                  </td>
                </tr>

                ${order.awbCode ? `
                <tr>
                  <td colspan="2" style="border-top: 1px solid #f0e6ee; padding-top: 14px; margin-top: 8px;">
                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888;">Courier Dispatch Partner</div>
                    <div style="font-size: 13px; font-weight: 700; color: #161114; margin-top: 3px;">
                      ${order.courierName || 'iThink Logistics Partner'} &bull; AWB: <span style="font-family: monospace; color: #b13896; font-size: 14px;">${order.awbCode}</span>
                    </div>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Purchased Items Section -->
          <tr>
            <td style="padding: 10px 36px;" class="mobile-padding">
              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px;">
                Purchased Pieces (${items.length} item${items.length > 1 ? 's' : ''})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #161114;">
                    <th align="left" colspan="2" style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Product Details</th>
                    <th align="center" style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Qty</th>
                    <th align="right" style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Price Summary Breakdown -->
          <tr>
            <td style="padding: 16px 36px;" class="mobile-padding">
              <table width="100%" cellpadding="6" cellspacing="0" style="border-top: 1px solid #f0e6ee; padding-top: 14px;">
                <tr>
                  <td style="font-size: 13px; color: #666;">Subtotal</td>
                  <td align="right" style="font-size: 13px; color: #161114; font-weight: 600;">${formatCurrency(subtotal)}</td>
                </tr>
                ${discount > 0 ? `
                <tr>
                  <td style="font-size: 13px; color: #15803d; font-weight: 600;">Promotional Privilege / Discount</td>
                  <td align="right" style="font-size: 13px; color: #15803d; font-weight: 700;">-${formatCurrency(discount)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="font-size: 13px; color: #666;">Insured Courier Delivery</td>
                  <td align="right" style="font-size: 13px; color: #15803d; font-weight: 600;">
                    ${shipping > 0 ? formatCurrency(shipping) : 'Complimentary (Free)'}
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 16px; font-weight: 700; color: #161114; padding-top: 12px; border-top: 2px solid #161114;">
                    Total Payable Amount
                  </td>
                  <td align="right" style="font-size: 22px; font-weight: 700; color: #b13896; padding-top: 12px; border-top: 2px solid #161114; font-family: 'Playfair Display', Georgia, serif;">
                    ${formatCurrency(total)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer & Shipping Details -->
          <tr>
            <td style="padding: 10px 36px 24px 36px;" class="mobile-padding">
              <table width="100%" cellpadding="18" cellspacing="0" style="background-color: #F8F4EF; border-radius: 14px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #b13896; margin-bottom: 8px;">
                      Shipping Destination &amp; Recipient ${addr.addressType ? `(${addr.addressType})` : ''}
                    </div>
                    <div style="font-size: 14px; font-weight: 700; color: #161114;">${recipientName}</div>
                    <div style="font-size: 13px; color: #555; margin-top: 4px; line-height: 1.6;">
                      ${addressFormatted || 'Address on file'}<br/>
                      ${addr.landmark ? `Landmark: ${addr.landmark}<br/>` : ''}
                      Contact: <strong>${customerPhone}</strong> ${addr.altPhone ? `| Alt: ${addr.altPhone}` : ''}<br/>
                      Email: <strong>${customerEmail}</strong>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Buttons (Single Unified CTA) -->
          <tr>
            <td style="padding: 6px 36px 36px 36px; text-align: center;" class="mobile-padding">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${viewOrderUrl}" target="_blank" style="display: inline-block; padding: 15px 36px; background-color: #b13896; color: #ffffff; text-decoration: none; border-radius: 9999px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; box-shadow: 0 4px 18px rgba(177, 56, 150, 0.35);">
                      View Order &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #161114; padding: 32px 24px; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.6; border-top: 1px solid #2d242a;">
              <div style="font-size: 17px; font-family: 'Playfair Display', Georgia, serif; color: #ffffff; letter-spacing: 3px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">
                TUKA BOUTIQUE
              </div>
              <div style="font-size: 11px; color: #d1d5db; margin-bottom: 12px; line-height: 1.5;">
                Shop No 82, Poonam Parkview, Yazoo Park, Global City, Virar West, PIN 401303
              </div>
              <div style="margin-bottom: 14px;">
                <a href="https://wa.me/917400444522" target="_blank" style="color: #25D366; text-decoration: none; font-weight: 700; margin: 0 8px;">
                  WhatsApp Concierge: +91 74004 44522
                </a>
                <span style="color: #4b5563;">•</span>
                <a href="mailto:tukasupport@gmail.com" style="color: #f4cfeb; text-decoration: none; margin: 0 8px;">
                  tukasupport@gmail.com
                </a>
              </div>
              <div style="font-size: 11px; color: #6b7280;">
                &copy; ${new Date().getFullYear()} Tuka Boutique. All rights reserved. Authentic Bengal Handloom Heritage.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export const generateAdminEmailHtml = (order) => {
  const orderNumber = order.orderNumber || order.orderId || "ORD-PENDING";
  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
  const itemsList = items
    .map(
      (i) => `
    <li style="margin-bottom: 8px; font-size: 13px;">
      <strong>${i.productName || i.name}</strong> 
      ${i.size ? `[Size: <strong style="color: #b13896;">${i.size}</strong>]` : ""} 
      ${i.color ? `[Color: ${i.color}]` : ""}
      &mdash; Qty: <strong>${i.quantity || 1}</strong> @ ${formatCurrency(i.unitPrice || i.price)} 
      (Line Total: ${formatCurrency(i.subtotal || (Number(i.unitPrice || i.price || 0) * Number(i.quantity || 1)))})
    </li>
  `
    )
    .join("");

  const addr = order.shippingAddress || {};

  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #111;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 28px; border-radius: 14px; border: 1px solid #e0e0e0; box-shadow: 0 4px 15px rgba(0,0,0,0.04);">
    <div style="border-bottom: 2px solid #b13896; padding-bottom: 14px; margin-bottom: 20px;">
      <h2 style="color: #b13896; margin: 0; font-size: 20px;">🚨 New Order Received: #${orderNumber}</h2>
      <div style="font-size: 12px; color: #666; margin-top: 4px;">Tuka Boutique &bull; Automated Atelier Fulfillment Alert</div>
    </div>
    
    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; background: #fdfbf9; border: 1px solid #f0e6ee; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
      <tr>
        <td><strong>Customer Name:</strong> ${order.customerName || addr.fullName || "N/A"}</td>
        <td><strong>Customer Email:</strong> ${order.customerEmail || "N/A"}</td>
      </tr>
      <tr>
        <td><strong>Phone:</strong> ${order.customerPhone || addr.phone || "N/A"}</td>
        <td><strong>Account Type:</strong> ${order.isGuest ? 'Guest User' : `Registered User (UID: ${order.userId || 'N/A'})`}</td>
      </tr>
      <tr>
        <td><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</td>
        <td><strong>Payment Status:</strong> <strong style="color: ${String(order.paymentStatus).toLowerCase() === 'paid' ? '#15803d' : '#b45309'};">${String(order.paymentStatus || 'Pending').toUpperCase()}</strong></td>
      </tr>
      ${order.bankReference ? `<tr><td colspan="2"><strong>Cashfree Bank Ref / UTR:</strong> <span style="font-family: monospace;">${order.bankReference}</span></td></tr>` : ''}
      ${order.paymentId ? `<tr><td colspan="2"><strong>Payment ID:</strong> <span style="font-family: monospace;">${order.paymentId}</span></td></tr>` : ''}
      ${order.awbCode ? `<tr><td colspan="2"><strong>iThink Logistics AWB:</strong> <span style="font-family: monospace; color: #b13896;">${order.awbCode}</span> (${order.courierName || 'Assigned Courier'})</td></tr>` : ''}
    </table>

    <h3 style="font-size: 15px; margin-bottom: 8px; color: #161114;">Purchased Products (${items.length})</h3>
    <ul style="padding-left: 20px; margin-top: 4px;">
      ${itemsList || '<li>No itemized lines recorded</li>'}
    </ul>

    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

    <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px;">
      <tr>
        <td>Subtotal:</td>
        <td align="right">${formatCurrency(order.subtotal)}</td>
      </tr>
      ${order.discount > 0 ? `<tr><td style="color: #15803d;">Discount:</td><td align="right" style="color: #15803d;">-${formatCurrency(order.discount)}</td></tr>` : ''}
      <tr>
        <td>Shipping:</td>
        <td align="right">${order.shipping > 0 ? formatCurrency(order.shipping) : 'Free'}</td>
      </tr>
      <tr>
        <td style="font-size: 16px; font-weight: bold; padding-top: 8px;">Final Amount:</td>
        <td align="right" style="font-size: 18px; font-weight: bold; color: #b13896; padding-top: 8px;">${formatCurrency(order.total)}</td>
      </tr>
    </table>

    <h4 style="margin-top: 24px; margin-bottom: 8px; font-size: 14px;">Shipping Address:</h4>
    <p style="background: #fdf8fb; padding: 12px; border-radius: 6px; border-left: 4px solid #b13896; font-size: 13px; line-height: 1.5; margin: 0;">
      <strong>${order.customerName || addr.fullName || ''}</strong><br/>
      ${addr.houseNumber ? `${addr.houseNumber}, ` : ''}${addr.street || addr.address || ''}<br/>
      ${addr.locality ? `${addr.locality}, ` : ''}${addr.city || ''}, ${addr.state || ''} - <strong>${addr.pincode || ''}</strong><br/>
      ${addr.landmark ? `Landmark: ${addr.landmark}<br/>` : ''}
      Phone: ${order.customerPhone || addr.phone || ''} ${addr.altPhone ? `| Alt: ${addr.altPhone}` : ''}
    </p>

    <p style="font-size: 11px; color: #888; margin-top: 24px; border-top: 1px solid #f0f0f0; padding-top: 12px;">
      Order ID: ${order.orderId || 'N/A'} | Order Number: #${orderNumber} | Idempotency Key: ${order.idempotencyKey || 'N/A'}
    </p>
  </div>
</body>
</html>
  `;
};

export const sendOrderEmails = async (orderData) => {
  loadEnvFallback();
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || `"Tuka Boutique" <${smtpUser || "orders@tuka.co.in"}>`;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@tuka.co.in";

  const emailResult = {
    customer: "pending",
    admin: "pending",
    error: null,
  };

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("[Nodemailer] SMTP credentials missing in environment. Email dispatches skipped.");
    emailResult.customer = "failed";
    emailResult.admin = "failed";
    emailResult.error = "SMTP credentials not configured in environment";
    return emailResult;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: Boolean(process.env.SMTP_SECURE === "true" || smtpPort === 465),
    auth: { user: smtpUser, pass: smtpPass },
  });

  // Prepare logo attachment for inline CID rendering
  const attachments = [];
  const localLogoPath = path.resolve(process.cwd(), "public", "img", "tuka-logo-brand.png");
  if (fs.existsSync(localLogoPath)) {
    attachments.push({
      filename: "tuka-logo.png",
      path: localLogoPath,
      cid: "tukaLogo",
    });
  }

  const orderNumber = orderData.orderNumber || orderData.orderId || "Order";

  // 1. Customer Order Confirmation Email
  try {
    const customerHtml = generateCustomerEmailHtml(orderData);
    await transporter.sendMail({
      from: smtpFrom,
      to: orderData.customerEmail,
      subject: `Order Confirmation #${orderNumber} - Tuka Boutique`,
      html: customerHtml,
      attachments,
    });
    emailResult.customer = "sent";
    console.log(`[EmailService] Customer order confirmation successfully sent to ${orderData.customerEmail} for #${orderNumber}`);
  } catch (err) {
    console.error("[EmailService] Customer email delivery error:", err);
    emailResult.customer = "failed";
    emailResult.error = err.message;
  }

  // 2. Admin Alert Email
  try {
    const adminHtml = generateAdminEmailHtml(orderData);
    await transporter.sendMail({
      from: smtpFrom,
      to: adminEmail,
      subject: `[NEW ORDER] #${orderNumber} - ${orderData.customerName || 'Customer'} (Tuka Boutique)`,
      html: adminHtml,
      attachments,
    });
    emailResult.admin = "sent";
    console.log(`[EmailService] Admin order alert successfully sent to ${adminEmail} for #${orderNumber}`);
  } catch (err) {
    console.error("[EmailService] Admin email delivery error:", err);
    emailResult.admin = "failed";
    if (!emailResult.error) emailResult.error = err.message;
  }

  return emailResult;
};
