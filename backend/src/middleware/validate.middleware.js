function badRequest(res, message) {
  return res.status(400).json({ message });
}

function isNonEmptyString(value, min = 1, max = 255) {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

function isEmail(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 254;
}

function validateLoginBody(req, res, next) {
  const { username, password } = req.body || {};
  if (!isNonEmptyString(username, 3, 64)) {
    return badRequest(res, "Username is required");
  }
  if (!isNonEmptyString(password, 6, 128)) {
    return badRequest(res, "Password is required");
  }
  return next();
}

function validateForgotPasswordBody(req, res, next) {
  const { email } = req.body || {};
  if (!isEmail(email)) {
    return badRequest(res, "Valid email is required");
  }
  return next();
}

function validateResetPasswordBody(req, res, next) {
  const { email, otp, newPassword } = req.body || {};
  if (!isEmail(email)) {
    return badRequest(res, "Valid email is required");
  }
  if (!/^[0-9]{6}$/.test(String(otp || ""))) {
    return badRequest(res, "Valid OTP is required");
  }
  if (!isNonEmptyString(newPassword, 8, 128)) {
    return badRequest(res, "New password must be at least 8 characters");
  }
  return next();
}

function validateUserBody(req, res, next) {
  const { username, email, password, role } = req.body || {};
  const validRoles = ["OWNER", "ACCOUNTANT", "STAFF"];

  if (!isNonEmptyString(username, 3, 64)) {
    return badRequest(res, "Valid username is required");
  }
  if (!isEmail(email)) {
    return badRequest(res, "Valid email is required");
  }
  if (password !== undefined && !isNonEmptyString(password, 8, 128)) {
    return badRequest(res, "Password must be at least 8 characters");
  }
  if (!validRoles.includes(role)) {
    return badRequest(res, "Invalid role");
  }

  return next();
}

module.exports = {
  validateLoginBody,
  validateForgotPasswordBody,
  validateResetPasswordBody,
  validateUserBody
};
