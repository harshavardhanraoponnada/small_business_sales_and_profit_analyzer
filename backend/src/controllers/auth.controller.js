const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const { readCSV, writeCSV } = require("../services/csv.service");
const { setOTP, verifyOTP, clearOTP } = require("../utils/otp.store");
const { sendOTPEmail } = require("../services/mail.service");
const auditService = require("../services/audit.service");

const usersFile = path.join(__dirname, "../data/users.csv");

/* ===== LOGIN ===== */
exports.login = async (req, res) => {
  const { username, password } = req.body;

  const users = await readCSV(usersFile);
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token, role: user.role });
};

/* ===== FORGOT PASSWORD ===== */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const users = await readCSV(usersFile);
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.json({ message: "If the account exists, an OTP has been sent" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  setOTP(email, otp);
  if (process.env.MAIL_USER && process.env.MAIL_PASS) {
    try {
      await sendOTPEmail(email, otp);
    } catch (error) {
      console.error("Failed to send OTP email");
    }
  }

  res.json({ message: "If the account exists, an OTP has been sent" });
};

/* ===== RESET PASSWORD ===== */
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const valid = verifyOTP(email, otp);
  if (!valid) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const users = await readCSV(usersFile);
  const index = users.findIndex(u => u.email === email);

  if (index === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  users[index].password_hash = hashed;

  await writeCSV(usersFile, users);
  clearOTP(email);

  res.json({ message: "Password reset successful" });
};

/* ===== ADD USER ===== */
exports.addUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  // Validate input
  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const users = await readCSV(usersFile);

  // Check if username or email already exists
  const existingUser = users.find(u => u.username === username || u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "Username or email already exists" });
  }

  // Validate role
  const validRoles = ["OWNER", "ACCOUNTANT", "STAFF"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  // Generate new ID
  const maxId = users.length > 0 ? Math.max(...users.map(u => parseInt(u.id))) : 0;
  const newId = maxId + 1;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: newId.toString(),
    username,
    email,
    password_hash: hashedPassword,
    role
  };

  users.push(newUser);
  await writeCSV(usersFile, users);

  // Log the action
  auditService.logAction({
    user: req.user,
    action: "ADD_USER",
    details: `User added: ${username} (${role})`
  });

  res.status(201).json({ message: "User added successfully", user: { id: newUser.id, username, email, role } });
};

/* ===== DELETE USER ===== */
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  const users = await readCSV(usersFile);
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  const userToDelete = users[index];

  // Prevent deletion of self
  if (userToDelete.id === req.user.id) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }

  // Prevent deletion of the last OWNER
  const owners = users.filter(u => u.role === "OWNER" && u.id !== id);
  if (userToDelete.role === "OWNER" && owners.length === 0) {
    return res.status(400).json({ message: "Cannot delete the last OWNER" });
  }

  users.splice(index, 1);
  await writeCSV(usersFile, users);

  // Log the action
  auditService.logAction({
    user: req.user,
    action: "DELETE_USER",
    details: `User deleted: ${userToDelete.username} (${userToDelete.role})`
  });

  res.json({ message: "User deleted successfully" });
};

/* ===== UPDATE USER ===== */
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;

  // Validate input
  if (!username || !email || !role) {
    return res.status(400).json({ message: "Username, email, and role are required" });
  }

  const users = await readCSV(usersFile);
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  const userToUpdate = users[index];

  // Check if username or email already exists (excluding current user)
  const existingUser = users.find(u => (u.username === username || u.email === email) && u.id !== id);
  if (existingUser) {
    return res.status(400).json({ message: "Username or email already exists" });
  }

  // Validate role
  const validRoles = ["OWNER", "ACCOUNTANT", "STAFF"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  // Prevent changing role of the last OWNER
  if (userToUpdate.role === "OWNER" && role !== "OWNER") {
    const owners = users.filter(u => u.role === "OWNER" && u.id !== id);
    if (owners.length === 0) {
      return res.status(400).json({ message: "Cannot change role of the last OWNER" });
    }
  }

  // Update user
  users[index].username = username;
  users[index].email = email;
  users[index].role = role;

  await writeCSV(usersFile, users);

  // Log the action
  auditService.logAction({
    user: req.user,
    action: "UPDATE_USER",
    details: `User updated: ${username} (${role})`
  });

  res.json({ message: "User updated successfully", user: { id, username, email, role } });
};

/* ===== GET USERS ===== */
exports.getUsers = async (req, res) => {
  const users = await readCSV(usersFile);

  // Return users without password hashes
  const safeUsers = users.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    reportFrequency: user.reportFrequency || "none",
    reportFormat: user.reportFormat || "pdf",
    receiveScheduledReports: user.receiveScheduledReports === "true"
  }));

  res.json(safeUsers);
};
