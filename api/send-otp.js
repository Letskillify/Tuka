import crypto from "node:crypto";
import nodemailer from "nodemailer";
import {
  clientDb,
  adminDb,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "./_lib/firebaseServer.js";

const getDb = () => clientDb;

const isValidEmail = (email) => {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const generateOtpHtml = (otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verification Code - House of Tuka</title>
</head>
<body style="margin:0; padding:0; background-color:#F8F4EF; font-family:'Plus Jakarta Sans', Arial, sans-serif; color:#161114;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F4EF; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#161114; padding: 32px; text-align:center;">
              <div style="font-size: 26px; font-family: Georgia, serif; color: #ffffff; letter-spacing: 4px; font-weight: 300;">
                HOUSE OF <span style="color: #f4cfeb; font-style: italic;">TUKA</span>
              </div>
              <div style="font-size: 10px; color: #b13896; text-transform: uppercase; letter-spacing: 3px; margin-top: 6px;">
                Authentic Bengal Handlooms
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 36px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #b13896; margin-bottom: 12px;">
                Authentication Protocol
              </div>
              <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 400; color: #161114; margin: 0 0 12px 0;">
                Your Verification Code
              </h1>
              <p style="font-size: 13px; color: #666666; margin: 0 0 28px 0; line-height: 1.6;">
                Use the 6-digit verification code below to sign in or create your House of Tuka account.
              </p>

              <!-- OTP Code Badge Box -->
              <div style="background-color: #161114; border: 1px solid #b13896; border-radius: 16px; padding: 20px; display: inline-block; width: 80%; margin-bottom: 24px;">
                <div style="font-family: monospace, Courier, sans-serif; font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #ffffff; text-align: center; margin-left: 12px;">
                  ${otp}
                </div>
              </div>

              <div style="font-size: 12px; color: #888888; margin-bottom: 24px;">
                ⏱️ This verification code is valid for <strong>10 minutes</strong>.
              </div>

              <div style="background-color: #F8F4EF; border-radius: 12px; padding: 16px; font-size: 11px; color: #666666; line-height: 1.5; text-align: left;">
                🔒 <strong>Security Warning:</strong> If you did not request this code, please ignore this email. Never share this code with anyone.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #161114; padding: 20px; text-align: center; color: #888888; font-size: 11px;">
              © ${new Date().getFullYear()} House of Tuka. Authentic Bengal Handloom Heritage.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawEmail = req.body?.email;
    if (!isValidEmail(rawEmail)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    const email = rawEmail.trim().toLowerCase();
    const db = getDb();

    // Check rate limiting / resend cooldown (60 seconds)
    const otpRef = doc(db, "otps", email);
    const existingSnap = await getDoc(otpRef);

    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      const lastCreatedTime = existingData.lastSentMs || new Date(existingData.createdAt?.seconds * 1000 || 0).getTime();
      const elapsedSeconds = (Date.now() - lastCreatedTime) / 1000;

      if (elapsedSeconds < 60) {
        const retryAfter = Math.ceil(60 - elapsedSeconds);
        return res.status(429).json({
          error: `Please wait ${retryAfter} second(s) before requesting a new OTP.`,
          cooldownSeconds: retryAfter
        });
      }
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Save hashed OTP in Firestore
    await setDoc(otpRef, {
      email,
      otpHash,
      expiresAt,
      attempts: 0,
      used: false,
      lastSentMs: Date.now(),
      createdAt: serverTimestamp()
    });

    // Send OTP via Nodemailer
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpUser = process.env.SMTP_USER || "tukasupport@gmail.com";
    const smtpPass = process.env.SMTP_PASS || "vfzoaatozycaowzh";
    const smtpFrom = process.env.SMTP_FROM || `"Tuka Clothing" <no-reply@tuka.co.in>`;

    if (!smtpUser || !smtpPass) {
      return res.status(503).json({ error: "Email service is temporarily unconfigured." });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: Boolean(process.env.SMTP_SECURE === "true" || smtpPort === 465),
      auth: { user: smtpUser, pass: smtpPass }
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: `${otp} is your House of Tuka verification code`,
      html: generateOtpHtml(otp)
    });

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${email}.`,
      cooldownSeconds: 60
    });
  } catch (err) {
    console.error("[SendOTP] Error sending OTP:", err);
    return res.status(500).json({ error: "Failed to send verification email. Please check address and try again." });
  }
}
