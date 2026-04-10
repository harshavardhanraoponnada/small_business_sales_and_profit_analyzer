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

const sendScheduledReportEmail = async ({
  to,
  username,
  frequency,
  reportFormat,
  scheduleTime,
  scheduleWeekday,
  periodStart,
  periodEnd,
  summary,
}) => {
  if (!to) {
    throw new Error("Email recipient is required");
  }

  const formatCurrency = (value) => Number(value || 0).toFixed(2);
  const periodStartText = periodStart ? new Date(periodStart).toLocaleString() : "N/A";
  const periodEndText = periodEnd ? new Date(periodEnd).toLocaleString() : "N/A";
  const normalizedFrequency = String(frequency || "daily").toLowerCase();
  const normalizedFormat = String(reportFormat || "pdf").toUpperCase();

  const subject = `Scheduled ${normalizedFrequency.toUpperCase()} Report - ${new Date().toISOString().slice(0, 10)}`;

  const text = [
    `Hello ${username || "User"},`,
    "",
    "This is your automated scheduled business report email.",
    `Frequency: ${normalizedFrequency}`,
    `Requested report format: ${normalizedFormat}`,
    `Scheduled time: ${scheduleTime || "09:00"}${normalizedFrequency === "weekly" ? ` (${scheduleWeekday || "monday"})` : ""}`,
    "",
    `Period: ${periodStartText} to ${periodEndText}`,
    `Total Sales: ${formatCurrency(summary?.salesTotal)}`,
    `Total Expenses: ${formatCurrency(summary?.expenseTotal)}`,
    `Net Profit: ${formatCurrency(summary?.profit)}`,
    `Sales Records: ${Number(summary?.salesCount || 0)}`,
    `Expense Records: ${Number(summary?.expenseCount || 0)}`,
    "",
    "This email was generated automatically.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Automated Scheduled Report</h2>
      <p>Hello <strong>${username || "User"}</strong>,</p>
      <p>This is your automated scheduled business report email.</p>

      <ul>
        <li><strong>Frequency:</strong> ${normalizedFrequency}</li>
        <li><strong>Requested report format:</strong> ${normalizedFormat}</li>
        <li><strong>Scheduled time:</strong> ${scheduleTime || "09:00"}${normalizedFrequency === "weekly" ? ` (${scheduleWeekday || "monday"})` : ""}</li>
      </ul>

      <p><strong>Period:</strong> ${periodStartText} to ${periodEndText}</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 480px;">
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Total Sales</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(summary?.salesTotal)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Total Expenses</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(summary?.expenseTotal)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Net Profit</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(summary?.profit)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Sales Records</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${Number(summary?.salesCount || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Expense Records</strong></td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${Number(summary?.expenseCount || 0)}</td>
          </tr>
        </tbody>
      </table>

      <p style="margin-top: 16px; color: #6b7280; font-size: 12px;">This email was generated automatically.</p>
    </div>
  `;

  try {
    const result = await transporter.sendMail({
      from: process.env.MAIL_USER || 'noreply@phoneverse.com',
      to,
      subject,
      text,
      html,
    });

    return result;
  } catch (error) {
    console.error("Scheduled report mail error:", error.message);
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
  sendScheduledReportEmail,
  setTransporter,
  getTransporter,
  createTransporter
};
