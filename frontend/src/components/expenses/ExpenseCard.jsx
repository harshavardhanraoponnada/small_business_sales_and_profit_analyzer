import { Calendar, Tag, FileText, Eye, Paperclip } from "lucide-react";
import { formatNumber } from "../../utils/numberFormat";

const UPLOAD_BASE_URL =
  import.meta.env.VITE_UPLOAD_BASE_URL ||
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const categoryIcons = {
  Rent: "🏠",
  Salary: "💰",
  Salaries: "💰",
  Electricity: "⚡",
  Internet: "🌐",
  Supplies: "📦",
  Refreshments: "☕",
  Maintenance: "🔧",
  Marketing: "📢",
  Utilities: "💡",
  Misc: "📌"
};

const categoryColors = {
  Rent: "#ef4444",
  Salary: "#10b981",
  Salaries: "#10b981",
  Electricity: "#f59e0b",
  Internet: "#3b82f6",
  Supplies: "#8b5cf6",
  Refreshments: "#ec4899",
  Maintenance: "#f97316",
  Marketing: "#14b8a6",
  Utilities: "#eab308",
  Misc: "#6b7280"
};

export default function ExpenseCard({ expense, theme }) {
  const categoryColor = categoryColors[expense.category] || "#6b7280";
  const categoryIcon = categoryIcons[expense.category] || "📌";

  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: "16px",
        padding: "1.5rem",
        border: `1px solid ${theme.border}`,
        transition: "all 0.3s ease",
        cursor: "default",
        position: "relative",
        overflow: "hidden"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = theme.isDarkMode
          ? "0 12px 24px rgba(0, 0, 0, 0.4)"
          : "0 12px 24px rgba(0, 0, 0, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Category indicator bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          backgroundColor: categoryColor
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              fontSize: "2rem",
              lineHeight: "1"
            }}
          >
            {categoryIcon}
          </div>
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
                padding: "0.375rem 0.875rem",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: "700",
                marginBottom: "0.25rem"
              }}
            >
              <Tag size={14} />
              {expense.category}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: "800",
            color: theme.text,
            textAlign: "right"
          }}
        >
          ₹{formatNumber(expense.amount)}
        </div>
      </div>

      {/* Description */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
          marginBottom: "1rem",
          color: theme.text
        }}
      >
        <FileText size={16} style={{ marginTop: "0.25rem", flexShrink: 0 }} />
        <p
          style={{
            margin: 0,
            fontSize: "0.95rem",
            lineHeight: "1.5",
            color: theme.textSecondary
          }}
        >
          {expense.description || "No description"}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "1rem",
          borderTop: `1px solid ${theme.border}`
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            color: theme.textSecondary
          }}
        >
          <Calendar size={14} />
          {new Date(expense.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
          })}
        </div>

        {expense.file && (
          <a
            href={`${UPLOAD_BASE_URL}/uploads/${expense.file}`}
            target="_blank"
            rel="noreferrer"
            style={{
              color: theme.accent,
              textDecoration: "none",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.375rem 0.875rem",
              borderRadius: "8px",
              backgroundColor: `${theme.accent}15`,
              fontSize: "0.875rem",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = `${theme.accent}25`;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = `${theme.accent}15`;
            }}
          >
            <Paperclip size={14} />
            Receipt
          </a>
        )}
      </div>
    </div>
  );
}
