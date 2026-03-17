const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

exports.sendOTPEmail = async (to, otp) => {
  await transporter.sendMail({
    to,
    subject: "Password Reset OTP - PhoneVerse",
    text: `Your OTP is ${otp}. It is valid for 10 minutes.`
  });
};
