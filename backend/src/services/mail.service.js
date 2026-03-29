const nodemailer = require("nodemailer");

// Create default transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
};

// Allow dependency injection for testing
let transporter = createTransporter();

const sendOTPEmail = async (to, otp) => {
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

// For testing - allow transporter override
const setTransporter = (mockTransporter) => {
  transporter = mockTransporter;
};

// For testing - get current transporter
const getTransporter = () => transporter;

module.exports = {
  sendOTPEmail,
  setTransporter,
  getTransporter,
  createTransporter
};
