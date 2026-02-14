import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(email: string, otp: string) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Your XPENSIFY Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 32px;">💸</span>
          <h1 style="color: #1d1d1f; margin-top: 10px;">XPENSIFY</h1>
        </div>
        <h2 style="color: #1d1d1f;">Password Reset Request</h2>
        <p style="color: #6e6e73; font-size: 16px;">We received a request to reset your password. Use the following 6-digit One-Time Password (OTP) to proceed:</p>
        <div style="background-color: #f5f5f7; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1d1d1f;">${otp}</span>
        </div>
        <p style="color: #86868b; font-size: 14px;">This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="color: #86868b; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} XPENSIFY. All rights reserved.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}
