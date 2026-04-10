const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../services/prisma.service");
const { setOTP, verifyOTP, clearOTP } = require("../utils/otp.store");
const { sendOTPEmail } = require("../services/mail.service");
const auditService = require("../services/audit.service");

/* ===== LOGIN ===== */
exports.login = async (req, res) => {
  try {
    console.log("🔐 LOGIN CONTROLLER CALLED");
    const { username, password } = req.body;
    console.log("👤 Username:", username, "Password length:", password?.length);

    const user = await prisma.user.findUnique({
      where: { username }
    });

    console.log("🔍 User found:", !!user);
    if (!user) {
      console.log("❌ User not found, returning 401");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    console.log("✔️ Password valid:", valid);
    if (!valid) {
      console.log("❌ Password invalid, returning 401");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log("✅ Login successful, token generated");
    res.json({ token, role: user.role });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ===== FORGOT PASSWORD ===== */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("🔍 Forgot password request for email:", email);

    if (!email) {
      console.log("❌ No email provided");
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log("ℹ️  User not found (security: still sending response):", email);
    } else {
      console.log("✅ User found:", user.username);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("🔐 Generated OTP:", otp);

    setOTP(email, otp);
    console.log("📝 OTP stored in memory");

    const isMailConfigured =
      !!process.env.MAIL_USER &&
      !!process.env.MAIL_PASS &&
      process.env.MAIL_USER !== "your_gmail@gmail.com" &&
      process.env.MAIL_PASS !== "your_app_password_here";

    if (isMailConfigured) {
      try {
        console.log("📧 Attempting to send OTP email to:", email);
        await sendOTPEmail(email, otp);
        console.log("✅ OTP email sent successfully");
      } catch (error) {
        console.error("❌ Failed to send OTP email:", error.message);
        // Still return success response for security (don't reveal email sending failures)
      }
    } else {
      console.log("⚠️  Email not configured, OTP stored in memory only");
    }

    res.json({ message: "If the account exists, an OTP has been sent" });
  } catch (error) {
    console.error("❌ Forgot password error:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ message: "Failed to process request" });
  }
};

/* ===== RESET PASSWORD ===== */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const valid = verifyOTP(email, otp);
    if (!valid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: hashed }
    });

    clearOTP(email);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

/* ===== ADD USER ===== */
exports.addUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate role
    const validRoles = ["OWNER", "ACCOUNTANT", "STAFF"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
        role
      }
    });

    // Log the action
    auditService.logAction({
      user: req.user,
      action: "ADD_USER",
      details: `User added: ${username} (${role})`
    });

    res.status(201).json({ 
      message: "User added successfully", 
      user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role } 
    });
  } catch (error) {
    console.error("Add user error:", error);
    res.status(500).json({ message: "Failed to add user" });
  }
};

/* ===== DELETE USER ===== */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userToDelete = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deletion of self
    if (userToDelete.id === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    // Prevent deletion of the last OWNER
    if (userToDelete.role === "OWNER") {
      const owners = await prisma.user.count({
        where: { role: "OWNER" }
      });
      if (owners <= 1) {
        return res.status(400).json({ message: "Cannot delete the last OWNER" });
      }
    }

    await prisma.user.delete({
      where: { id }
    });

    // Log the action
    auditService.logAction({
      user: req.user,
      action: "DELETE_USER",
      details: `User deleted: ${userToDelete.username} (${userToDelete.role})`
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

/* ===== UPDATE USER ===== */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body;

    // Validate input
    if (!username || !email || !role) {
      return res.status(400).json({ message: "Username, email, and role are required" });
    }

    // Validate role
    const validRoles = ["OWNER", "ACCOUNTANT", "STAFF"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const userToUpdate = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username or email already exists (excluding current user)
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          {
            OR: [
              { username },
              { email }
            ]
          },
          {
            NOT: { id }
          }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    // Prevent changing role of the last OWNER
    if (userToUpdate.role === "OWNER" && role !== "OWNER") {
      const owners = await prisma.user.count({
        where: { role: "OWNER" }
      });
      if (owners <= 1) {
        return res.status(400).json({ message: "Cannot change role of the last OWNER" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        username,
        email,
        role
      }
    });

    // Log the action
    auditService.logAction({
      user: req.user,
      action: "UPDATE_USER",
      details: `User updated: ${username} (${role})`
    });

    res.json({ 
      message: "User updated successfully", 
      user: { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email, role: updatedUser.role } 
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

/* ===== GET USERS ===== */
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        reportFrequency: true,
        reportFormat: true,
        reportScheduleTime: true,
        reportScheduleWeekday: true,
        receiveScheduledReports: true
      }
    });

    // Format response - set defaults for null fields
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      reportFrequency: user.reportFrequency || "none",
      reportFormat: user.reportFormat || "pdf",
      reportScheduleTime: user.reportScheduleTime || "09:00",
      reportScheduleWeekday: user.reportScheduleWeekday || "monday",
      receiveScheduledReports: user.receiveScheduledReports || false
    }));

    res.json(safeUsers);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
