import { useEffect, useState, useMemo, memo } from "react";
import api from "../services/api";
import { useTheme } from "../app/ThemeContext";
import { useAuth } from "../auth/authContext";
import { formatNumber } from "../utils/numberFormat";

import StatCard from "../components/common/StatCard";

import {
  ShoppingCart,
  AlertTriangle,
  Folder,
  Tag,
  Smartphone,
  Palette,
  Hash,
  Loader,
  IndianRupee,
  BarChart3,
  Calendar,
  FileText,
  Download,
  Eye,
  Package
} from "lucide-react";

const SaleRow = memo(({ sale, themeColors, user }) => (
  <tr style={{
    borderBottom: `1px solid ${themeColors.border}`,
    transition: "all 0.2s ease",
    cursor: "default"
  }}
  onMouseEnter={(ev) => ev.target.closest('tr').style.backgroundColor = `${themeColors.accent}10`}
  onMouseLeave={(ev) => ev.target.closest('tr').style.backgroundColor = "transparent"}
  >
    <td style={{ padding: "1.25rem", fontWeight: "500" }}>
      {new Date(sale.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}
    </td>
    <td style={{ padding: "1.25rem" }}>
      <span style={{
        backgroundColor: `${themeColors.accent}20`,
        color: themeColors.accent,
        padding: "0.25rem 0.75rem",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "600"
      }}>
        {sale.id.substring(0, 8)}
      </span>
    </td>
    <td style={{ padding: "1.25rem", fontWeight: "500" }}>
      {sale.variant?.variant_name || sale.product?.name || "Unknown"}
    </td>
    <td style={{ padding: "1.25rem", fontWeight: "600" }}>
      {sale.quantity}
    </td>
    <td style={{ padding: "1.25rem", fontWeight: "700", fontSize: "1.1rem" }}>
      ₹{formatNumber(sale.total)}
    </td>
    <td style={{ padding: "1.25rem" }}>
      {user.role !== "STAFF" ? (
        <button
          onClick={async () => {
            try {
              const response = await api.get(`/invoices/${sale.id}`, {
                responseType: 'blob'
              });
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `invoice_${sale.id}.pdf`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
            } catch (error) {
              console.error('Error downloading invoice:', error);
              alert('Failed to download invoice or not available');
            }
          }}
          style={{
            color: themeColors.accent,
            textDecoration: "none",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            backgroundColor: `${themeColors.accent}10`,
            border: "none",
            cursor: "default",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(ev) => {
            ev.target.style.backgroundColor = `${themeColors.accent}20`;
            ev.target.style.cursor = "pointer";
          }}
          onMouseLeave={(ev) => {
            ev.target.style.backgroundColor = `${themeColors.accent}10`;
            ev.target.style.cursor = "default";
          }}
        >
          <Download size={16} /> Download
        </button>
      ) : (
        <span style={{ color: themeColors.textSecondary, fontSize: "0.9rem" }}>
          Not available
        </span>
      )}
    </td>
  </tr>
));

export default memo(function Sales() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  // Data states
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);
  const [sales, setSales] = useState([]);

  // Selected values
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState(""); // stores variant_id
  const [quantity, setQuantity] = useState(1);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Find the currently selected variant object
  const selectedVariant = useMemo(() => variants.find(v => v.id === variant), [variants, variant]);

  // Calculate summary statistics
  const totalSales = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0), [sales]);
  const thisMonthSales = useMemo(() => sales
    .filter(sale => {
      const saleDate = new Date(sale.date);
      const now = new Date();
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, sale) => sum + Number(sale.total || 0), 0), [sales]);
  const totalItemsSold = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.quantity || 0), 0), [sales]);

  // Theme - Memoized to prevent recreation on every render
  const themeColors = useMemo(() => ({
    background: isDarkMode ? "#0f172a" : "#f8fafc",
    surface: isDarkMode ? "#1e293b" : "#ffffff",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    accent: "#3b82f6",
    error: "#ef4444",
    success: "#10b981"
  }), [isDarkMode]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, salesRes] = await Promise.all([
          api.get("/categories"),
          api.get("/sales")
        ]);
        setCategories(categoriesRes.data);
        setSales(salesRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!category) return;
    api.get(`/brands?categoryId=${category}`).then(res => setBrands(res.data));
    setBrand("");
    setModel("");
    setVariant("");
    setModels([]);
    setVariants([]);
  }, [category]);

  useEffect(() => {
    if (!brand) return;
    api.get(`/models?brandId=${brand}`).then(res => setModels(res.data));
    setModel("");
    setVariant("");
    setVariants([]);
  }, [brand]);

  useEffect(() => {
    if (!model) return;
    api.get(`/variants?modelId=${model}`).then(res => setVariants(res.data));
    setVariant("");
  }, [model]);

  /* ================= HANDLE SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedVariant) {
      setError("Please select a product variant");
      return;
    }

    if (quantity < 1) {
      setError("Please enter a valid quantity (minimum 1)");
      return;
    }

    if (quantity > selectedVariant.stock) {
      setError(`Insufficient stock. Available: ${selectedVariant.stock}`);
      return;
    }

    try {
      setLoading(true);
      await api.post("/sales", {
        variant_id: selectedVariant.id,
        quantity: Number(quantity),
        unit_price: Number(selectedVariant.selling_price)
      });

      // Reset form
      setCategory("");
      setBrand("");
      setModel("");
      setVariant("");
      setQuantity(1);

      // Refresh sales list
      const salesRes = await api.get("/sales");
      setSales(salesRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));

      // Show success message (you could replace this with a toast notification)
      alert("✅ Sale recorded successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to record sale. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 84px)",
      backgroundColor: themeColors.background,
      color: themeColors.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      transition: "all 0.3s ease"
    }}>
      <div style={{
          padding: "2rem",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {/* Summary Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem"
          }}>
            <StatCard
              title="Total Sales"
              value={`₹${formatNumber(totalSales)}`}
              icon={<IndianRupee />}
              theme={{ ...themeColors, isDarkMode }}
            />
            <StatCard
              title="This Month"
              value={`₹${formatNumber(thisMonthSales)}`}
              icon={<Calendar />}
              theme={{ ...themeColors, isDarkMode }}
            />
            <StatCard
              title="Items Sold"
              value={formatNumber(totalItemsSold)}
              icon={<Package />}
              theme={{ ...themeColors, isDarkMode }}
            />
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem"
          }}>
            {/* Add Sale Form */}
            <div style={{
              backgroundColor: themeColors.surface,
              borderRadius: "16px",
              padding: "2.5rem",
              boxShadow: isDarkMode
                ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                : "0 8px 32px rgba(0, 0, 0, 0.1)",
              border: `1px solid ${themeColors.border}`,
              transition: "all 0.3s ease"
            }}>
              <h1 style={{
                fontSize: "2.25rem",
                fontWeight: "800",
                margin: "0 0 2.5rem 0",
                color: themeColors.text,
                display: "flex",
                alignItems: "center",
                gap: "0.75rem"
              }}>
                <ShoppingCart size={28} />
                Add New Sale
              </h1>

              {error && (
                <div style={{
                  backgroundColor: `${themeColors.error}15`,
                  border: `1px solid ${themeColors.error}`,
                  color: themeColors.error,
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}>
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: themeColors.text
                  }}>
                    <Folder size={16} />
                    Category
                  </label>
                  <select
                    required
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      borderRadius: "12px",
                      border: `2px solid ${themeColors.border}`,
                      backgroundColor: themeColors.surface,
                      color: themeColors.text,
                      fontSize: "1rem",
                      transition: "all 0.2s ease",
                      cursor: "pointer"
                    }}
                    onFocus={(e) => e.target.style.borderColor = themeColors.accent}
                    onBlur={(e) => e.target.style.borderColor = themeColors.border}
                  >
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: themeColors.text
                  }}>
                    <Tag size={16} />
                    Brand
                  </label>
                  <select
                    required
                    disabled={!category}
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      borderRadius: "12px",
                      border: `2px solid ${themeColors.border}`,
                      backgroundColor: themeColors.surface,
                      color: themeColors.text,
                      fontSize: "1rem",
                      transition: "all 0.2s ease",
                      cursor: category ? "pointer" : "not-allowed",
                      opacity: category ? 1 : 0.6
                    }}
                    onFocus={(e) => e.target.style.borderColor = themeColors.accent}
                    onBlur={(e) => e.target.style.borderColor = themeColors.border}
                  >
                    <option value="">Select brand</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: themeColors.text
                  }}>
                    <Smartphone size={16} />
                    Model
                  </label>
                  <select
                    required
                    disabled={!brand}
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      borderRadius: "12px",
                      border: `2px solid ${themeColors.border}`,
                      backgroundColor: themeColors.surface,
                      color: themeColors.text,
                      fontSize: "1rem",
                      transition: "all 0.2s ease",
                      cursor: brand ? "pointer" : "not-allowed",
                      opacity: brand ? 1 : 0.6
                    }}
                    onFocus={(e) => e.target.style.borderColor = themeColors.accent}
                    onBlur={(e) => e.target.style.borderColor = themeColors.border}
                  >
                    <option value="">Select model</option>
                    {models.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: themeColors.text
                  }}>
                    <Palette size={16} />
                    Variant
                  </label>
                  <select
                    required
                    disabled={!model}
                    value={variant}
                    onChange={e => setVariant(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      borderRadius: "12px",
                      border: `2px solid ${themeColors.border}`,
                      backgroundColor: themeColors.surface,
                      color: themeColors.text,
                      fontSize: "1rem",
                      transition: "all 0.2s ease",
                      cursor: model ? "pointer" : "not-allowed",
                      opacity: model ? 1 : 0.6
                    }}
                    onFocus={(e) => e.target.style.borderColor = themeColors.accent}
                    onBlur={(e) => e.target.style.borderColor = themeColors.border}
                  >
                    <option value="">Select variant</option>
                    {variants.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.variant_name} (Stock: {v.stock})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Display Selected Variant Price and Total */}
                {selectedVariant && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    padding: "1rem",
                    backgroundColor: `${themeColors.accent}10`,
                    borderRadius: "8px",
                    border: `1px solid ${themeColors.accent}20`
                  }}>
                    <div style={{
                      textAlign: "center",
                      color: themeColors.text
                    }}>
                      <div style={{
                        fontSize: "0.9rem",
                        color: themeColors.textSecondary,
                        marginBottom: "0.25rem"
                      }}>
                        Unit Price
                      </div>
                      <div style={{
                        fontSize: "1.2rem",
                        fontWeight: "700",
                        color: themeColors.accent
                      }}>
                        ₹{formatNumber(selectedVariant.selling_price)}
                      </div>
                    </div>
                    <div style={{
                      textAlign: "center",
                      color: themeColors.text
                    }}>
                      <div style={{
                        fontSize: "0.9rem",
                        color: themeColors.textSecondary,
                        marginBottom: "0.25rem"
                      }}>
                        Total
                      </div>
                      <div style={{
                        fontSize: "1.2rem",
                        fontWeight: "700",
                        color: themeColors.success
                      }}>
                        ₹{formatNumber(Number(selectedVariant.selling_price) * quantity)}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: themeColors.text
                  }}>
                    <Hash size={16} />
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    style={{
                      width: "100%",
                      padding: "1rem",
                      borderRadius: "12px",
                      border: `2px solid ${themeColors.border}`,
                      backgroundColor: themeColors.surface,
                      color: themeColors.text,
                      fontSize: "1rem",
                      transition: "all 0.2s ease"
                    }}
                    onFocus={(e) => e.target.style.borderColor = themeColors.accent}
                    onBlur={(e) => e.target.style.borderColor = themeColors.border}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !variant || quantity < 1}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: loading ? themeColors.textSecondary : themeColors.accent,
                    color: "white",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    cursor: loading || !variant || quantity < 1 ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem"
                  }}
                >
                  {loading ? <><Loader size={16} /> Recording...</> : <><IndianRupee size={16} /> Record Sale</>}
                </button>
              </form>
            </div>

            {/* Sales History */}
            <div style={{
              backgroundColor: themeColors.surface,
              borderRadius: "16px",
              padding: "2.5rem",
              border: `1px solid ${themeColors.border}`,
              boxShadow: isDarkMode
                ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                : "0 8px 32px rgba(0, 0, 0, 0.1)"
            }}>
              <h2 style={{
                fontSize: "1.75rem",
                fontWeight: "700",
                marginBottom: "2rem",
                color: themeColors.text,
                display: "flex",
                alignItems: "center",
                gap: "0.75rem"
              }}>
                <BarChart3 size={24} />
                Sales History
              </h2>

              {loading ? (
                <div style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: themeColors.textSecondary
                }}>
                  <Loader size={16} /> Loading sales...
                </div>
              ) : sales.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: themeColors.textSecondary
                }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛒</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "600" }}>No sales yet</div>
                  <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>Record your first sale above!</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: isDarkMode
                      ? "0 4px 6px rgba(0, 0, 0, 0.3)"
                      : "0 4px 6px rgba(0, 0, 0, 0.1)"
                  }}>
                    <thead>
                      <tr style={{
                        backgroundColor: themeColors.accent,
                        color: "white"
                      }}>
                        <th style={{ padding: "1.25rem", textAlign: "left", fontWeight: "600" }}><Calendar size={16} /> Date</th>
                        <th style={{ padding: "1.25rem", textAlign: "left", fontWeight: "600" }}><Hash size={16} /> Sale ID</th>
                        <th style={{ padding: "1.25rem", textAlign: "left", fontWeight: "600" }}><Package size={16} /> Product</th>
                        <th style={{ padding: "1.25rem", textAlign: "left", fontWeight: "600", paddingRight: "2rem" }}><Smartphone size={16} /> Quantity</th>
                        <th style={{ padding: "1.25rem", textAlign: "left", fontWeight: "600" }}><IndianRupee size={16} /> Total</th>
                        <th style={{ padding: "1.25rem", textAlign: "left", fontWeight: "600", paddingLeft: "2rem" }}><FileText size={16} /> Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => (
                        <SaleRow key={sale.id} sale={sale} themeColors={themeColors} user={user} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
});
