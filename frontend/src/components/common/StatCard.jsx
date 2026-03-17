import React, { memo } from 'react';

const StatCard = memo(function StatCard({ title, value, change, changeType, icon, theme, extraContent }) {
  return (
    <div style={{
      padding: "1.5rem",
      backgroundColor: theme.surface,
      borderRadius: "12px",
      boxShadow: theme.isDarkMode
        ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
        : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      border: `1px solid ${theme.border}`,
      color: theme.text
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "0.5rem"
      }}>
        <h3 style={{
          fontSize: "0.9rem",
          fontWeight: "600",
          color: theme.textSecondary,
          margin: 0
        }}>
          {title}
        </h3>
        <span style={{
          fontSize: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {typeof icon === 'string' ? icon : React.cloneElement(icon, { size: 24 })}
        </span>
      </div>
      <div style={{
        fontSize: "2rem",
        fontWeight: "700",
        color: theme.text,
        marginBottom: "0.25rem"
      }}>
        {value}
      </div>
      {change && (
        <div style={{
          fontSize: "0.9rem",
          fontWeight: "600",
          color: changeType === "positive" ? "#10b981" : "#ef4444"
        }}>
          {change}
        </div>
      )}
      {extraContent && (
        <div style={{ marginTop: "0.5rem" }}>
          {extraContent}
        </div>
      )}
    </div>
  );
});

export default StatCard;
