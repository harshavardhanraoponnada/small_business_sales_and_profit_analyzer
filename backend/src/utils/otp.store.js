const otpStore = new Map();

exports.setOTP = (email, otp) => {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });
};

exports.verifyOTP = (email, otp) => {
  const record = otpStore.get(email);
  if (!record) return false;
  if (Date.now() > record.expiresAt) return false;
  return record.otp === otp;
};

exports.clearOTP = (email) => {
  otpStore.delete(email);
};
