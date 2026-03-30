import { useEffect, useState } from "react";
import { useTheme } from "../app/ThemeContext";
import api from "../services/api";
import { formatNumber } from "../utils/numberFormat";

import { Package } from "lucide-react";

export default function Products() {
  const { isDarkMode } = useTheme();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products").then(res => setProducts(res.data));
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
      minHeight: "calc(100vh - 84px)",
      backgroundColor: themeColors.background,
      color: themeColors.text
    }}>
      <div style={{
        backgroundColor: themeColors.background
      }}>
        <div style={{
          padding: "2rem",
          maxWidth: "1200px",
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
              color: themeColors.text
            }}>
              <Package size={32} /> Products Inventory
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
                    }}>Name</th>
                    <th style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: "600"
                    }}>Stock</th>
                    <th style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: "600"
                    }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, index) => (
                    <tr key={index} style={{
                      borderBottom: `1px solid ${themeColors.border}`,
                      backgroundColor: themeColors.surface
                    }}>
                      <td style={{
                        padding: "1rem",
                        color: themeColors.text
                      }}>{p.name}</td>
                      <td style={{
                        padding: "1rem",
                        color: themeColors.text
                      }}>{formatNumber(p.stock)}</td>
                      <td style={{
                        padding: "1rem",
                        color: themeColors.text
                      }}>₹{formatNumber(p.selling_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
