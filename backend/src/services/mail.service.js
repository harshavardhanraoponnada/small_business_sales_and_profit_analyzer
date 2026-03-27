const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

exports.sendOTPEmail = async (to, otp) => {
  if (!to || !otp) {
    throw new Error("Email recipient and OTP are required");
  }

  try {
    const result = await transporter.sendMail({
      from: process.env.MAIL_USER || 'noreply@phoneverse.com',
      to,
      subject: "Password Reset OTP - PhoneVerse",
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
      html: `<h2>Password Reset OTP</h2><p>Your OTP is: <strong>${otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`
    });
    return result;
  } catch (error) {
    console.error("Mail service error:", error.message);
    throw error;
  }
};
