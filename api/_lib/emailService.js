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

const generateCustomerEmailHtml = (order) => {
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #f0e6ee;">
        <img src="${item.productImage || item.image || ''}" alt="${item.productName || item.name}" style="width: 50px; height: 60px; object-fit: cover; border-radius: 6px; display: block;" />
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #f0e6ee; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
        <div style="font-weight: 700; color: #161114; font-size: 14px;">${item.productName || item.name}</div>
        ${item.size ? `<div style="font-size: 12px; color: #b13896; margin-top: 2px;">Size: <strong>${item.size}</strong></div>` : ''}
        ${item.color ? `<div style="font-size: 12px; color: #666; margin-top: 2px;">Color: ${item.color}</div>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #f0e6ee; text-align: center; font-size: 13px; color: #444; font-family: Arial, sans-serif;">
        x${item.quantity || 1}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #f0e6ee; text-align: right; font-weight: 700; color: #161114; font-size: 14px; font-family: Arial, sans-serif;">
        ${formatCurrency(item.subtotal || (Number(item.unitPrice || item.price || 0) * (item.quantity || 1)))}
      </td>
    </tr>
  `
    )
    .join("");

  const addr = order.shippingAddress || {};

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation #${order.orderNumber}</title>
</head>
<body style="margin:0; padding:0; background-color:#F8F4EF; font-family:'Plus Jakarta Sans', Arial, sans-serif; color:#161114;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F4EF; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#161114; padding: 32px; text-align:center;">
              <div style="font-size: 28px; font-family: Georgia, serif; color: #ffffff; letter-spacing: 4px; font-weight: 300;">
                HOUSE OF <span style="color: #f4cfeb; font-style: italic;">TUKA</span>
              </div>
              <div style="font-size: 10px; color: #b13896; text-transform: uppercase; letter-spacing: 3px; margin-top: 6px;">
                Authentic Bengal Handlooms
              </div>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td style="padding: 32px 32px 16px 32px;">
              <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 400; margin: 0 0 8px 0; color: #161114;">
                Thank you for your order, ${order.customerName || 'Valued Patron'}!
              </h1>
              <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.6;">
                We are delighted to confirm your acquisition. Master hereditary weavers in Bengal have received your request and are preparing your handloom piece for dispatch.
              </p>
            </td>
          </tr>

          <!-- Order Summary Card -->
          <tr>
            <td style="padding: 16px 32px;">
              <table width="100%" cellpadding="12" cellspacing="0" style="background-color:#FDFBF9; border-radius:16px; border:1px solid #f0e6ee;">
                <tr>
                  <td width="50%">
                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888;">Order Number</div>
                    <div style="font-size: 16px; font-weight: 700; color: #b13896; font-family: monospace; margin-top: 2px;">#${order.orderNumber}</div>
                  </td>
                  <td width="50%" text-align="right">
                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888;">Payment Method</div>
                    <div style="font-size: 14px; font-weight: 700; color: #161114; margin-top: 2px;">${order.paymentMethod === 'online' ? 'Online Payment (Paid)' : 'Cash on Delivery'}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="border-bottom: 2px solid #161114;">
                    <th align="left" style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Product</th>
                    <th align="left" style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Details</th>
                    <th align="center" style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Qty</th>
                    <th align="right" style="padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals Breakdown -->
          <tr>
            <td style="padding: 16px 32px;">
              <table width="100%" cellpadding="6" cellspacing="0" style="border-top: 1px solid #f0e6ee; padding-top: 12px;">
                <tr>
                  <td style="font-size: 13px; color: #666;">Subtotal</td>
                  <td align="right" style="font-size: 13px; color: #161114; font-weight: 600;">${formatCurrency(order.subtotal)}</td>
                </tr>
                ${order.discount > 0 ? `
                <tr>
                  <td style="font-size: 13px; color: #2e7d32;">Discount</td>
                  <td align="right" style="font-size: 13px; color: #2e7d32; font-weight: 600;">-${formatCurrency(order.discount)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="font-size: 13px; color: #666;">Shipping & Insured Delivery</td>
                  <td align="right" style="font-size: 13px; color: #2e7d32; font-weight: 600;">${order.shipping > 0 ? formatCurrency(order.shipping) : 'Complimentary'}</td>
                </tr>
                <tr>
                  <td style="font-size: 16px; font-weight: 700; color: #161114; padding-top: 8px;">Total Acquisition</td>
                  <td align="right" style="font-size: 20px; font-weight: 700; color: #b13896; padding-top: 8px; font-family: Georgia, serif;">${formatCurrency(order.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 16px 32px 32px 32px;">
              <div style="background-color: #F8F4EF; border-radius: 16px; padding: 20px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #b13896; margin-bottom: 8px;">
                  Destination Atelier ${addr.addressType ? `(${addr.addressType})` : ''}
                </div>
                <div style="font-size: 14px; font-weight: 700; color: #161114;">${order.customerName}</div>
                <div style="font-size: 13px; color: #555; margin-top: 4px; line-height: 1.5;">
                  ${addr.houseNumber ? `${addr.houseNumber}, ` : ''}${addr.street || addr.address || ''}<br/>
                  ${addr.locality ? `${addr.locality}, ` : ''}${addr.city || ''}${addr.state ? `, ${addr.state}` : ''} - <strong>${addr.pincode || ''}</strong><br/>
                  ${addr.landmark ? `Landmark: ${addr.landmark}<br/>` : ''}
                  Phone: ${order.customerPhone || addr.phone || 'N/A'} ${addr.altPhone ? `| Alt: ${addr.altPhone}` : ''}
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #161114; padding: 24px; text-align: center; color: #888; font-size: 12px; line-height: 1.6;">
              Need concierge assistance or live weaving updates?<br/>
              WhatsApp our master weavers directly: <strong style="color: #25D366;">+91 74004 44522</strong><br/><br/>
              © ${new Date().getFullYear()} House of Tuka. All rights reserved.
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

const generateAdminEmailHtml = (order) => {
  const itemsList = (order.items || [])
    .map(
      (i) => `
    <li style="margin-bottom: 8px;">
      <strong>${i.productName || i.name}</strong> 
      ${i.size ? `[Size: <strong>${i.size}</strong>]` : ''} 
      — Qty: <strong>${i.quantity || 1}</strong> @ ${formatCurrency(i.unitPrice || i.price)} 
      (Subtotal: ${formatCurrency(i.subtotal)})
    </li>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #111;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e0e0e0;">
    <h2 style="color: #b13896; margin-top: 0;">🚨 New Order Received: #${order.orderNumber}</h2>
    <p>A new order has been placed on House of Tuka.</p>
    
    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; background: #f4f4f4; border-radius: 8px; margin-bottom: 20px;">
      <tr>
        <td><strong>Customer Name:</strong> ${order.customerName}</td>
        <td><strong>Customer Email:</strong> ${order.customerEmail}</td>
      </tr>
      <tr>
        <td><strong>Phone:</strong> ${order.customerPhone}</td>
        <td><strong>Account Type:</strong> ${order.isGuest ? 'Guest User' : `Registered User (UID: ${order.userId})`}</td>
      </tr>
      <tr>
        <td><strong>Payment Method:</strong> ${order.paymentMethod}</td>
        <td><strong>Payment Status:</strong> ${order.paymentStatus}</td>
      </tr>
      ${order.paymentId ? `<tr><td colSpan="2"><strong>Payment ID:</strong> ${order.paymentId}</td></tr>` : ''}
    </table>

    <h3>Purchased Products</h3>
    <ul>
      ${itemsList}
    </ul>

    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

    <div style="font-size: 16px; font-weight: bold; color: #111;">
      Total Amount: <span style="color: #b13896;">${formatCurrency(order.total)}</span>
    </div>

    <h4 style="margin-top: 20px;">Shipping Destination:</h4>
    <p style="background: #fdf8fb; padding: 12px; border-radius: 6px; border-left: 4px solid #b13896;">
      ${order.customerName}<br/>
      ${order.shippingAddress?.address || order.shippingAddress?.street || ''}<br/>
      ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}<br/>
      Phone: ${order.customerPhone}
    </p>

    <p style="font-size: 11px; color: #888; margin-top: 30px;">
      Order ID: ${order.orderId} | Idempotency Key: ${order.idempotencyKey || 'N/A'}
    </p>
  </div>
</body>
</html>
  `;
};

export const sendOrderEmails = async (orderData) => {
  loadEnvFallback();
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || `"House of Tuka" <orders@tuka.in>`;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@tuka.in";

  const emailResult = {
    customer: "pending",
    admin: "pending",
    error: null,
  };

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("[Nodemailer] SMTP credentials missing in environment. Email dispatches recorded as skipped/unconfigured.");
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

  // Customer Confirmation
  try {
    const customerHtml = generateCustomerEmailHtml(orderData);
    await transporter.sendMail({
      from: smtpFrom,
      to: orderData.customerEmail,
      subject: `Order Confirmation #${orderData.orderNumber} - House of Tuka`,
      html: customerHtml,
    });
    emailResult.customer = "sent";
  } catch (err) {
    console.error("[Nodemailer] Customer email error:", err);
    emailResult.customer = "failed";
    emailResult.error = err.message;
  }

  // Admin Alert
  try {
    const adminHtml = generateAdminEmailHtml(orderData);
    await transporter.sendMail({
      from: smtpFrom,
      to: adminEmail,
      subject: `[NEW ORDER] #${orderData.orderNumber} - ${orderData.customerName}`,
      html: adminHtml,
    });
    emailResult.admin = "sent";
  } catch (err) {
    console.error("[Nodemailer] Admin email error:", err);
    emailResult.admin = "failed";
    if (!emailResult.error) emailResult.error = err.message;
  }

  return emailResult;
};
