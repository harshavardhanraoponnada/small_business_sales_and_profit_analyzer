import { useState } from "react";
import { Download, FileText } from "lucide-react";
import api from "../../services/api";

export default function ExportButtons({ reportType, theme, disabled = false }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async (format) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post(
        "/reports/export",
        {
          type: reportType,
          format: format,
          range: "monthly",
        },
        {
          responseType: "blob",
        }
      );

      // Create a blob URL and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${reportType}_${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "pdf" : "xlsx"}`
      );
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      setError(err.response?.data?.error || "Failed to export report");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
      <button
        onClick={() => handleExport("pdf")}
        disabled={isLoading || disabled}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#ef4444",
          color: "#ffffff",
          border: "none",
          borderRadius: "6px",
          fontSize: "0.875rem",
          fontWeight: "500",
          cursor: isLoading || disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          opacity: isLoading || disabled ? 0.5 : 1,
        }}
        title="Export as PDF"
      >
        <FileText size={16} />
        PDF
      </button>

      <button
        onClick={() => handleExport("xlsx")}
        disabled={isLoading || disabled}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#10b981",
          color: "#ffffff",
          border: "none",
          borderRadius: "6px",
          fontSize: "0.875rem",
          fontWeight: "500",
          cursor: isLoading || disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          opacity: isLoading || disabled ? 0.5 : 1,
        }}
        title="Export as Excel"
      >
        <Download size={16} />
        Excel
      </button>

      {error && (
        <div
          style={{
            color: "#ef4444",
            fontSize: "0.875rem",
            marginTop: "0.5rem",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
