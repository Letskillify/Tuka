import fs from 'fs';
import nodemailer from 'nodemailer';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        env[match[1]] = val;
    }
});

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(env.SMTP_PORT || 465),
    secure: Boolean(env.SMTP_SECURE === 'true' || env.SMTP_PORT == 465),
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
    }
});

console.log('Testing SMTP verify with user:', env.SMTP_USER, 'pass len:', env.SMTP_PASS?.length);
try {
    await transporter.verify();
    console.log('Verify SUCCESS!');
    
    // Now test sending to the same email address
    const from = env.SMTP_FROM || `"Tuka Clothing" <${env.SMTP_USER}>`;
    console.log('Sending test mail from:', from, 'to:', env.SMTP_USER);
    const info = await transporter.sendMail({
        from: from,
        to: env.SMTP_USER,
        subject: 'Tuka Test Verification Email',
        text: 'This is a test OTP verification message.'
    });
    console.log('Send SUCCESS! Message ID:', info.messageId);
} catch (err) {
    console.error('SMTP ERROR:', err.message);
    if (err.code) console.error('Error Code:', err.code);
    if (err.response) console.error('SMTP Response:', err.response);
}
