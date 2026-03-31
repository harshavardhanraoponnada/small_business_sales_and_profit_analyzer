import { useEffect, useState } from "react";
import { useTheme } from "../app/ThemeContext";
import api from "../services/api";

import { Search } from "lucide-react";

export default function Audit() {
  const { isDarkMode } = useTheme();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get("/audit").then(res => setLogs(res.data));
  }, []);

  const themeColors = {
    background: isDarkMode ? "#0f172a" : "#f8fafc",
    surface: isDarkMode ? "#1e293b" : "#ffffff",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    accent: "#3b82f6"
  };

  return (
    <div style={{
      backgroundColor: themeColors.background,
      color: themeColors.text,
      minHeight: "calc(100vh - 84px)"
    }}>
      <div style={{
        padding: "2rem",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        <div style={{
          backgroundColor: themeColors.surface,
          borderRadius: "12px",
          padding: "2rem",
          boxShadow: isDarkMode
            ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
            : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          border: `1px solid ${themeColors.border}`
        }}>
          <h1 style={{
            fontSize: "2rem",
            fontWeight: "700",
            margin: "0 0 2rem 0",
            color: themeColors.text,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <Search size={28} />
            Audit Logs
          </h1>

          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              borderRadius: "8px",
              overflow: "hidden"
            }}>
              <thead>
                <tr style={{
                  backgroundColor: themeColors.accent,
                  color: "white"
                }}>
                  <th style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "600"
                  }}>Timestamp</th>
                  <th style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "600"
                  }}>Action</th>
                  <th style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "600"
                  }}>Details</th>
                  <th style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "600"
                  }}>User</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index} style={{
                    borderBottom: `1px solid ${themeColors.border}`,
                    backgroundColor: themeColors.surface
                  }}>
                    <td style={{
                      padding: "1rem",
                      color: themeColors.text
                    }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{
                      padding: "1rem",
                      color: themeColors.text
                    }}>{log.action}</td>
                    <td style={{
                      padding: "1rem",
                      color: themeColors.text
                    }}>{log.details}</td>
                    <td style={{
                      padding: "1rem",
                      color: themeColors.text
                    }}>{log.username}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
