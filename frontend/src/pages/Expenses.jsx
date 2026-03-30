import { useEffect, useState } from "react";
import { useTheme } from "../app/ThemeContext";
import api from "../services/api";
import StatCard from "../components/common/StatCard";
import ExpenseCard from "../components/expenses/ExpenseCard";
import CategoryBreakdown from "../components/expenses/CategoryBreakdown";
import MonthlyExpenseChart from "../components/expenses/MonthlyExpenseChart";
import CategoryCalendarToggle from "../components/expenses/CategoryCalendarToggle";

import { IndianRupee, Package, CreditCard, FileText, Eye, AlertTriangle, Calendar, Folder, Loader, Upload, BarChart3, Mail, Edit, Paperclip, File, Plus, Inbox, Home, Briefcase, Zap, Globe } from "lucide-react";
import ReceiptRupee from "../components/common/ReceiptRupee";
import { formatNumber } from "../utils/numberFormat";

export default function Expenses() {
  const { isDarkMode } = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    category: "",
    amount: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [dateFilterStart, setDateFilterStart] = useState("");
  const [dateFilterEnd, setDateFilterEnd] = useState("");
  const [dateFilterStartCategory, setDateFilterStartCategory] = useState("");
  const [dateFilterEndCategory, setDateFilterEndCategory] = useState("");

  const loadExpenses = async () => {
    try {
      setLoading(true);
      console.log("Loading expenses data...");
      
      const [expensesRes, categoryRes, monthlyRes] = await Promise.all([
        api.get("/expenses"),
        api.get("/expenses/category-summary"),
        api.get("/expenses/monthly-category")
      ]);
      
      console.log("Expenses loaded:", expensesRes.data.length);
      console.log("Category data:", categoryRes.data);
      console.log("Monthly data:", monthlyRes.data);
      
      setExpenses(expensesRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setCategoryData(categoryRes.data);
      setMonthlyData(monthlyRes.data);
    } catch (err) {
      console.error("Error loading expenses:", err);
      console.error("Error response:", err.response);
      setError("Failed to load expenses: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const validateForm = () => {
    if (!form.category) return "Please select a category";
    if (!form.amount || Number(form.amount) <= 0) return "Please enter a valid amount";
    if (!form.description.trim()) return "Please enter a description";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("category", form.category);
      formData.append("amount", Number(form.amount));
      formData.append("description", form.description);
      if (file) formData.append("file", file);

      await api.post("/expenses", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setForm({ category: "", amount: "", description: "" });
      setFile(null);
      loadExpenses();
    } catch {
      setError("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => {
    const amount = Number(expense.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const filteredExpenses = expenses.filter((expense) => {
    if (!dateFilterStart && !dateFilterEnd) return true;
    
    const expenseDate = new Date(expense.date);
    const startDate = dateFilterStart ? new Date(dateFilterStart) : null;
    const endDate = dateFilterEnd ? new Date(dateFilterEnd) : null;
    
    if (startDate && expenseDate < startDate) return false;
    if (endDate && expenseDate > endDate) return false;
    
    return true;
  });

  // Filter expenses for category breakdown
  const filteredExpensesCategory = expenses.filter((expense) => {
    if (!dateFilterStartCategory && !dateFilterEndCategory) return true;
    
    const expenseDate = new Date(expense.date);
    const startDate = dateFilterStartCategory ? new Date(dateFilterStartCategory) : null;
    const endDate = dateFilterEndCategory ? new Date(dateFilterEndCategory) : null;
    
    if (startDate && expenseDate < startDate) return false;
    if (endDate && expenseDate > endDate) return false;
    
    return true;
  });

  // Calculate filtered category data
  const filteredCategoryData = filteredExpensesCategory.length > 0
    ? Object.entries(
        filteredExpensesCategory.reduce((acc, expense) => {
          const category = expense.category || "Misc";
          const amount = Number(expense.amount) || 0;
          acc[category] = (acc[category] || 0) + amount;
          return acc;
        }, {})
      ).map(([category, amount]) => ({ category, amount }))
    : [];

  const handleClearDateFilterCategory = () => {
    setDateFilterStartCategory("");
    setDateFilterEndCategory("");
  };

  const handleClearDateFilter = () => {
    setDateFilterStart("");
    setDateFilterEnd("");
  };

  const themeColors = {
    background: isDarkMode ? "#0f172a" : "#f8fafc",
    surface: isDarkMode ? "#1e293b" : "#ffffff",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    accent: "#3b82f6",
    error: "#ef4444",
    success: "#10b981"
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
          {/* Summary Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem"
          }}>
            <StatCard
              title="Total Expenses"
              value={`₹${formatNumber(totalExpenses)}`}
              icon={<ReceiptRupee />}
              theme={{ ...themeColors, isDarkMode }}
            />
            <StatCard
              title="This Month"
              value={`₹${formatNumber(expenses
                .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
                .reduce((sum, e) => {
                  const amount = Number(e.amount);
                  return sum + (isNaN(amount) ? 0 : amount);
                }, 0))}`}
              icon={<Calendar />}
              theme={{ ...themeColors, isDarkMode }}
            />
            <StatCard
              title="Categories"
              value={new Set(expenses.map(e => e.category)).size}
              icon={<Folder />}
              theme={{ ...themeColors, isDarkMode }}
            />
          </div>

          {/* Add Expense Form */}
          <div style={{
            backgroundColor: themeColors.surface,
            borderRadius: "16px",
            padding: "2.5rem",
            boxShadow: isDarkMode
              ? "0 8px 32px rgba(0, 0, 0, 0.3)"
              : "0 8px 32px rgba(0, 0, 0, 0.1)",
            border: `1px solid ${themeColors.border}`,
            marginBottom: "2rem",
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
              <ReceiptRupee size={32} /> Add New Expense
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
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <form onSubmit={submit}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem",
                marginBottom: "2rem"
              }}>
                <div>
                  <label style={{
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: themeColors.text,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    <Folder size={16} /> Category
                  </label>
                  <select
                    required
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
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
                    <option value="Rent">🏠 Rent</option>
                    <option value="Salaries">💰 Salaries</option>
                    <option value="Electricity">⚡ Electricity</option>
                    <option value="Internet">🌐 Internet</option>
                    <option value="Supplies">📦 Supplies</option>
                    <option value="Refreshments">☕ Refreshments</option>
                    <option value="Maintenance">🔧 Maintenance</option>
                    <option value="Marketing">📢 Marketing</option>
                    <option value="Utilities">💡 Utilities</option>
                    <option value="Misc">📌 Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: themeColors.text,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    <IndianRupee size={16} /> Amount
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
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
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <label style={{
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  marginBottom: "0.75rem",
                  color: themeColors.text,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <Edit size={16} /> Description
                </label>
                <input
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter expense description"
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

              <div style={{ marginBottom: "2.5rem" }}>
                <label style={{
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  marginBottom: "0.75rem",
                  color: themeColors.text,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <Paperclip size={16} /> Receipt (Optional)
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragActive ? themeColors.accent : themeColors.border}`,
                    borderRadius: "12px",
                    padding: "2rem",
                    textAlign: "center",
                    backgroundColor: dragActive ? `${themeColors.accent}10` : themeColors.surface,
                    transition: "all 0.3s ease",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => setFile(e.target.files[0])}
                    style={{ display: "none" }}
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" style={{ cursor: "pointer" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                      <File size={48} />
                    </div>
                    <div style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: themeColors.text,
                      marginBottom: "0.5rem"
                    }}>
                      {file ? file.name : "Drop your receipt here or click to browse"}
                    </div>
                    <div style={{
                      fontSize: "0.9rem",
                      color: themeColors.textSecondary
                    }}>
                      Supports: JPG, PNG, PDF (Max 10MB)
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "1rem",
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: loading ? themeColors.textSecondary : themeColors.accent,
                  color: "white",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                {loading ? <Loader size={20} /> : <Plus size={20} />} {loading ? "Adding..." : "Add Expense"}
              </button>
            </form>
          </div>

          {/* Analytics Section */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "2rem",
            marginBottom: "2rem"
          }}>
            <CategoryBreakdown 
              categoryData={filteredCategoryData} 
              theme={themeColors}
              dateFilterStart={dateFilterStartCategory}
              dateFilterEnd={dateFilterEndCategory}
              onDateFilterStartChange={setDateFilterStartCategory}
              onDateFilterEndChange={setDateFilterEndCategory}
              onClearDateFilter={handleClearDateFilterCategory}
            />
            <MonthlyExpenseChart monthlyData={monthlyData} theme={themeColors} />
          </div>

          {/* Expense History */}
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
              <BarChart3 size={24} /> Expense History
            </h2>

            {loading ? (
              <div style={{
                textAlign: "center",
                padding: "3rem",
                color: themeColors.textSecondary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
              }}>
                <Loader size={20} />
                Loading expenses...
              </div>
            ) : expenses.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "3rem",
                color: themeColors.textSecondary
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                  <Inbox size={48} />
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: "600" }}>No expenses yet</div>
                <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>Add your first expense above!</div>
              </div>
            ) : (
              <CategoryCalendarToggle 
                expenses={expenses} 
                theme={themeColors}
                categoryData={categoryData}
              />
            )}
          </div>

          {/* Expense Cards Grid */}
          {!loading && expenses.length > 0 && (
            <div style={{
              backgroundColor: themeColors.surface,
              borderRadius: "16px",
              padding: "2.5rem",
              border: `1px solid ${themeColors.border}`,
              boxShadow: isDarkMode
                ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                : "0 8px 32px rgba(0, 0, 0, 0.1)",
              marginTop: "2rem"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "2rem",
                gap: "1rem",
                flexWrap: "wrap"
              }}>
                <h2 style={{
                  fontSize: "1.75rem",
                  fontWeight: "700",
                  color: themeColors.text,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  margin: 0
                }}>
                  <FileText size={24} /> All Expenses
                </h2>

                {/* Date Filter Controls */}
                <div style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  flexWrap: "wrap"
                }}>
                  <input
                    type="date"
                    value={dateFilterStart}
                    onChange={(e) => setDateFilterStart(e.target.value)}
                    placeholder="Start Date"
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "8px",
                      border: `1px solid ${themeColors.border}`,
                      backgroundColor: themeColors.surface,
                      color: themeColors.text,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onFocus={(e) => e.target.style.borderColor = themeColors.accent}
                    onBlur={(e) => e.target.style.borderColor = themeColors.border}
                  />

                  <span style={{ color: themeColors.textSecondary, fontWeight: "600" }}>to</span>

                  <input
                    type="date"
                    value={dateFilterEnd}
                    onChange={(e) => setDateFilterEnd(e.target.value)}
                    placeholder="End Date"
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "8px",
                      border: `1px solid ${themeColors.border}`,
                      backgroundColor: themeColors.surface,
                      color: themeColors.text,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onFocus={(e) => e.target.style.borderColor = themeColors.accent}
                    onBlur={(e) => e.target.style.borderColor = themeColors.border}
                  />

                  {(dateFilterStart || dateFilterEnd) && (
                    <button
                      onClick={handleClearDateFilter}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "8px",
                        border: `1px solid ${themeColors.border}`,
                        backgroundColor: `${themeColors.error}10`,
                        color: themeColors.error,
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = `${themeColors.error}20`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = `${themeColors.error}10`;
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Results info */}
              {filteredExpenses.length !== expenses.length && (
                <div style={{
                  padding: "1rem",
                  backgroundColor: `${themeColors.accent}10`,
                  border: `1px solid ${themeColors.accent}30`,
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  fontSize: "0.9rem",
                  color: themeColors.text,
                  fontWeight: "600"
                }}>
                  Showing {filteredExpenses.length} of {expenses.length} expenses
                </div>
              )}

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "1.5rem"
              }}>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense, index) => (
                    <ExpenseCard
                      key={expense.id || index}
                      expense={expense}
                      theme={themeColors}
                    />
                  ))
                ) : (
                  <div style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "3rem",
                    color: themeColors.textSecondary
                  }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                      <Calendar size={48} />
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                      No expenses found in this date range
                    </div>
                    <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                      Try adjusting your filter dates
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
