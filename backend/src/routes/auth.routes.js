const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth.controller");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditLogger");
const { createRateLimiter } = require("../middleware/rateLimit.middleware");
const {
  validateLoginBody,
  validateForgotPasswordBody,
  validateResetPasswordBody,
  validateUserBody
} = require("../middleware/validate.middleware");

const loginLimiter = createRateLimiter({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX || 10),
  message: "Too many login attempts. Please try again later."
});

const forgotPasswordLimiter = createRateLimiter({
  windowMs: Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
  max: Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX || 5),
  message: "Too many OTP requests. Please try again later."
});

const resetPasswordLimiter = createRateLimiter({
  windowMs: Number(process.env.RESET_PASSWORD_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
  max: Number(process.env.RESET_PASSWORD_RATE_LIMIT_MAX || 10),
  message: "Too many reset attempts. Please try again later."
});

// LOGIN
router.post(
  "/login",
  loginLimiter,
  validateLoginBody,
  controller.login,
  audit("LOGIN", () => "User logged in")
);

// FORGOT PASSWORD
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateForgotPasswordBody,
  controller.forgotPassword,
  audit("FORGOT_PASSWORD", () => "OTP requested")
);

// RESET PASSWORD
router.post(
  "/reset-password",
  resetPasswordLimiter,
  validateResetPasswordBody,
  controller.resetPassword,
  audit("RESET_PASSWORD", () => "Password reset successful")
);

// ADD USER
router.post(
  "/add-user",
  auth,
  role("OWNER"),
  validateUserBody,
  controller.addUser,
  audit("ADD_USER", req => `Added user: ${req.body.username}`)
);

// DELETE USER
router.delete(
  "/delete-user/:id",
  auth,
  role("OWNER"),
  controller.deleteUser,
  audit("DELETE_USER", req => `Deleted user ID: ${req.params.id}`)
);

// UPDATE USER
router.put(
  "/update-user/:id",
  auth,
  role("OWNER"),
  validateUserBody,
  controller.updateUser,
  audit("UPDATE_USER", req => `Updated user ID: ${req.params.id}`)
);

// GET USERS
router.get(
  "/users",
  auth,
  role("OWNER"),
  controller.getUsers
);

module.exports = router;
