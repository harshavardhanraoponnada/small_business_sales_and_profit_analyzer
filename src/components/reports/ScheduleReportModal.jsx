import { useState } from "react";
import { X, Clock, Bell } from "lucide-react";
import api from "../../services/api";

export default function ScheduleReportModal({ isOpen, onClose, reportType, theme }) {
  const [formData, setFormData] = useState({
    reportType: reportType || "summary",
    format: "pdf",
    frequency: "daily",
    recipients: "",
    enabled: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse recipients (comma-separated emails)
      const recipients = formData.recipients
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      const response = await api.post("/reports/schedule", {
        reportType: formData.reportType,
        format: formData.format,
        frequency: formData.frequency,
        recipients: recipients,
        enabled: formData.enabled,
      });

      if (response.data.success) {
        setSuccess("Report schedule created successfully!");
        setFormData({
          reportType: reportType || "summary",
          format: "pdf",
          frequency: "daily",
          recipients: "",
          enabled: true,
        });

        // Close modal after success
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.data.error || "Failed to create schedule");
      }
    } catch (err) {
      console.error("Schedule error:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to create schedule"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: "12px",
          padding: "2rem",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          color: theme.text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={24} style={{ color: "#3b82f6" }} />
            <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600" }}>
              Schedule Report
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: theme.textSecondary,
            }}
          >
            <X />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Report Type */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                fontSize: "0.875rem",
                color: theme.textSecondary,
              }}
            >
              Report Type
            </label>
            <select
              name="reportType"
              value={formData.reportType}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.isDarkMode ? "#334155" : "#f8fafc",
                color: theme.text,
                fontSize: "0.875rem",
              }}
            >
              <option value="summary">Summary</option>
              <option value="sales-trend">Sales Trend</option>
              <option value="profit-trend">Profit Trend</option>
              <option value="expense-distribution">Expense Distribution</option>
              <option value="expenses">Expenses</option>
            </select>
          </div>

          {/* Format */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                fontSize: "0.875rem",
                color: theme.textSecondary,
              }}
            >
              Format
            </label>
            <select
              name="format"
              value={formData.format}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.isDarkMode ? "#334155" : "#f8fafc",
                color: theme.text,
                fontSize: "0.875rem",
              }}
            >
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel</option>
            </select>
          </div>

          {/* Frequency */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                fontSize: "0.875rem",
                color: theme.textSecondary,
              }}
            >
              Frequency
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.isDarkMode ? "#334155" : "#f8fafc",
                color: theme.text,
                fontSize: "0.875rem",
              }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Recipients */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                fontSize: "0.875rem",
                color: theme.textSecondary,
              }}
            >
              Recipients (comma-separated emails)
            </label>
            <textarea
              name="recipients"
              value={formData.recipients}
              onChange={handleInputChange}
              placeholder="email1@example.com, email2@example.com"
              rows="3"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.isDarkMode ? "#334155" : "#f8fafc",
                color: theme.text,
                fontSize: "0.875rem",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {/* Enabled toggle */}
          <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              name="enabled"
              checked={formData.enabled}
              onChange={handleInputChange}
              id="enabled-checkbox"
              style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
            />
            <label
              htmlFor="enabled-checkbox"
              style={{
                fontWeight: "500",
                fontSize: "0.875rem",
                color: theme.textSecondary,
                cursor: "pointer",
              }}
            >
              Enable this schedule
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                padding: "0.75rem",
                borderRadius: "6px",
                marginBottom: "1rem",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div
              style={{
                backgroundColor: "#dcfce7",
                color: "#166534",
                padding: "0.75rem",
                borderRadius: "6px",
                marginBottom: "1rem",
                fontSize: "0.875rem",
              }}
            >
              {success}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: "transparent",
                color: theme.text,
                fontWeight: "500",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: isLoading ? "#9ca3af" : "#3b82f6",
                color: "#ffffff",
                fontWeight: "500",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: "0.875rem",
              }}
            >
              {isLoading ? "Creating..." : "Create Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
