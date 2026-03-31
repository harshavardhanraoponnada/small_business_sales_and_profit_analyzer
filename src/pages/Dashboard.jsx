/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useTheme } from "../app/ThemeContext";
import { useAuth } from "../auth/authContext";
import api from "../services/api";

import StatCard from "../components/common/StatCard";

import SalesTrendChart from "../charts/SalesTrendChart";
import ProfitTrendChart from "../charts/ProfitTrendChart";

import ExpenseAnalytics from "../components/dashboard/ExpenseAnalytics";
import ExportButtons from "../components/reports/ExportButtons";
import ScheduleReportModal from "../components/reports/ScheduleReportModal";

import { Package, Receipt, TrendingUp, AlertTriangle, IndianRupee, Clock } from "lucide-react";
import ReceiptRupee from "../components/common/ReceiptRupee";
import { formatNumber } from "../utils/numberFormat";

export default function Dashboard() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const isStaff = user?.role === "STAFF";

  /* ================= KPI STATE ================= */
  const [stats, setStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    cogs: 0,
    netProfit: 0,
  });

  /* ================= CHART STATES ================= */
  const [salesTrend, setSalesTrend] = useState([]);
  const [profitTrend, setProfitTrend] = useState([]);


  /* ================= QUICK STATS STATES ================= */
  const [salesPeriod, setSalesPeriod] = useState("daily");
  const [expensesPeriod, setExpensesPeriod] = useState("daily");
  const [profitPeriod, setProfitPeriod] = useState("daily");
  const [quickStats, setQuickStats] = useState({
    sales: 0,
    units: 0,
    expenses: 0,
    profit: 0,
  });
  const [lowStock, setLowStock] = useState([]);

  /* ================= SCHEDULE MODAL STATE ================= */
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("summary");

  /* ================= THEME COLORS ================= */
  const themeColors = {
    background: isDarkMode ? "#0f172a" : "#f8fafc",
    surface: isDarkMode ? "#1e293b" : "#ffffff",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    isDarkMode,
  };

  /* ================= DATA FETCH ================= */
  useEffect(() => {
    // Only proceed if user is authenticated
    if (!user) return;

    // Only fetch summary data for owner/accountant
    if (!isStaff) {
      api.get("/reports/summary")
        .then(res => setStats(res.data))
        .catch(() => setStats({
          totalSales: 0,
          totalExpenses: 0,
          cogs: 0,
          netProfit: 0,
        }));

      api.get("/reports/profit-trend")
        .then(res => setProfitTrend(res.data))
        .catch(() => setProfitTrend([]));


    } else {
      // For staff, set empty data for restricted endpoints
      setStats({
        totalSales: 0,
        totalExpenses: 0,
        cogs: 0,
        netProfit: 0,
      });
      setProfitTrend([]);

    }

    // Fetch sales trend for all authenticated users (now unrestricted)
    api.get("/reports/sales-trend")
      .then(res => setSalesTrend(res.data))
      .catch(() => setSalesTrend([]));

    // Fetch quick stats for sales, expenses, profit (available to all authenticated users)
    const fetchQuickStats = () => {
      api.get(`/reports/quick-stats?type=${salesPeriod}`)
        .then(res => setQuickStats(prev => ({ ...prev, sales: res.data.sales, units: res.data.units })))
        .catch(() => setQuickStats(prev => ({ ...prev, sales: 0, units: 0 })));

      api.get(`/reports/quick-stats?type=${expensesPeriod}`)
        .then(res => setQuickStats(prev => ({ ...prev, expenses: res.data.expenses })))
        .catch(() => setQuickStats(prev => ({ ...prev, expenses: 0 })));

      api.get(`/reports/quick-stats?type=${profitPeriod}`)
        .then(res => setQuickStats(prev => ({ ...prev, profit: res.data.profit })))
        .catch(() => setQuickStats(prev => ({ ...prev, profit: 0 })));
    };

    fetchQuickStats();

    // Fetch low stock alerts (available to all authenticated users)
    api.get("/reports/low-stock")
      .then(res => setLowStock(res.data))
      .catch(() => setLowStock([]));
  }, [salesPeriod, expensesPeriod, profitPeriod, isStaff, user]);

  /* ================= UI ================= */
  return (
    <div
      style={{
        minHeight: "calc(100vh - 84px)",
        backgroundColor: themeColors.background,
        color: themeColors.text,
      }}
    >
      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>

          {isStaff ? (
            <>
              {/* ===== STAFF DASHBOARD ===== */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "1.5rem",
                  marginBottom: "2rem",
                }}
              >
                <StatCard
                  title={`${salesPeriod.charAt(0).toUpperCase() + salesPeriod.slice(1)} Sales`}
                  value={`₹${formatNumber(quickStats.sales)}`}
                  icon="₹"
                  theme={themeColors}
                  extraContent={
                    <select
                      value={salesPeriod}
                      onChange={(e) => setSalesPeriod(e.target.value)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        border: `1px solid ${themeColors.border}`,
                        backgroundColor: themeColors.surface,
                        color: themeColors.text,
                        fontSize: "0.8rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  }
                />

                <StatCard
                  title="Units Sold"
                  value={`${formatNumber(quickStats.units)}`}
                  icon={<Package />}
                  theme={themeColors}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <StatCard
                    title="Low Stock Alerts"
                    value={`${lowStock.length}`}
                    icon={<AlertTriangle />}
                    theme={themeColors}
                  />
                  {lowStock.length > 0 && (
                    <div
                      style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        backgroundColor: themeColors.surface,
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: "8px",
                        padding: "0.5rem",
                      }}
                    >
                      {lowStock.map((item, index) => (
                        <div key={index} style={{ fontSize: "0.8rem", color: themeColors.text }}>
                          {item.full_name} - Stock: {item.stock}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ===== OPTIONAL SALES TREND CHART ===== */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "1.5rem",
                }}
              >
                <div
                  style={{
                    backgroundColor: themeColors.surface,
                    borderRadius: "12px",
                    padding: "1.5rem",
                    border: `1px solid ${themeColors.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>
                      Sales Trend
                    </h3>
                    <ExportButtons reportType="sales-trend" theme={themeColors} />
                  </div>
                  <SalesTrendChart data={salesTrend} theme={themeColors} />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ===== OWNER/ACCOUNTANT DASHBOARD ===== */}
              {/* ===== KPI CARDS ===== */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "1.5rem",
                  marginBottom: "2rem",
                }}
              >
                <StatCard
                  title="Total Sales"
                  value={`₹${formatNumber(stats.totalSales)}`}
                  icon="₹"
                  theme={themeColors}
                />
                <StatCard
                  title="COGS"
                  value={`₹${formatNumber(stats.cogs)}`}
                  icon={<Package />}
                  theme={themeColors}
                />
                <StatCard
                  title="Expenses"
                  value={`₹${formatNumber(stats.totalExpenses)}`}
                  icon={<ReceiptRupee />}
                  theme={themeColors}
                />
                <StatCard
                  title="Net Profit"
                  value={`₹${formatNumber(stats.netProfit)}`}
                  icon={<TrendingUp />}
                  theme={themeColors}
                />
              </div>

              {/* ===== QUICK STATS SECTION ===== */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "1.5rem",
                  marginBottom: "2rem",
                }}
              >
                <StatCard
                  title={`${salesPeriod.charAt(0).toUpperCase() + salesPeriod.slice(1)} Sales`}
                  value={`₹${formatNumber(quickStats.sales)}`}
                  icon="₹"
                  theme={themeColors}
                  extraContent={
                    <select
                      value={salesPeriod}
                      onChange={(e) => setSalesPeriod(e.target.value)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        border: `1px solid ${themeColors.border}`,
                        backgroundColor: themeColors.surface,
                        color: themeColors.text,
                        fontSize: "0.8rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  }
                />

                <StatCard
                  title={`${expensesPeriod.charAt(0).toUpperCase() + expensesPeriod.slice(1)} Expenses`}
                  value={`₹${formatNumber(quickStats.expenses)}`}
                  icon={<ReceiptRupee />}
                  theme={themeColors}
                  extraContent={
                    <select
                      value={expensesPeriod}
                      onChange={(e) => setExpensesPeriod(e.target.value)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        border: `1px solid ${themeColors.border}`,
                        backgroundColor: themeColors.surface,
                        color: themeColors.text,
                        fontSize: "0.8rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  }
                />

                <StatCard
                  title={`${profitPeriod.charAt(0).toUpperCase() + profitPeriod.slice(1)} Net Profit`}
                  value={`₹${formatNumber(quickStats.profit)}`}
                  icon={<TrendingUp />}
                  theme={themeColors}
                  extraContent={
                    <select
                      value={profitPeriod}
                      onChange={(e) => setProfitPeriod(e.target.value)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        border: `1px solid ${themeColors.border}`,
                        backgroundColor: themeColors.surface,
                        color: themeColors.text,
                        fontSize: "0.8rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  }
                />

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <StatCard
                    title="Low Stock Alerts"
                    value={`${lowStock.length}`}
                    icon={<AlertTriangle />}
                    theme={themeColors}
                  />
                  {lowStock.length > 0 && (
                    <div
                      style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        backgroundColor: themeColors.surface,
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: "8px",
                        padding: "0.5rem",
                      }}
                    >
                      {lowStock.map((item, index) => (
                        <div key={index} style={{ fontSize: "0.8rem", color: themeColors.text }}>
                          {item.full_name} - Stock: {item.stock}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <ExpenseAnalytics theme={themeColors} />

              {/* ===== REPORT TOOLBARS & CHARTS (VERTICAL) ===== */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "1.5rem",
                }}
              >
                {/* Sales Trend Card */}
                <div
                  style={{
                    backgroundColor: themeColors.surface,
                    borderRadius: "12px",
                    padding: "1.5rem",
                    border: `1px solid ${themeColors.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>
                      Sales Trend
                    </h3>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <ExportButtons reportType="sales-trend" theme={themeColors} />
                      {(user?.role === "OWNER" || user?.role === "ACCOUNTANT") && (
                        <button
                          onClick={() => {
                            setSelectedReportType("sales-trend");
                            setScheduleModalOpen(true);
                          }}
                          style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#f59e0b",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                          title="Schedule report"
                        >
                          <Clock size={16} />
                          Schedule
                        </button>
                      )}
                    </div>
                  </div>
                  <SalesTrendChart data={salesTrend} theme={themeColors} />
                </div>

                {/* Profit Trend Card */}
                <div
                  style={{
                    backgroundColor: themeColors.surface,
                    borderRadius: "12px",
                    padding: "1.5rem",
                    border: `1px solid ${themeColors.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>
                      Profit Trend
                    </h3>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <ExportButtons reportType="profit-trend" theme={themeColors} />
                      {(user?.role === "OWNER" || user?.role === "ACCOUNTANT") && (
                        <button
                          onClick={() => {
                            setSelectedReportType("profit-trend");
                            setScheduleModalOpen(true);
                          }}
                          style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#f59e0b",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                          title="Schedule report"
                        >
                          <Clock size={16} />
                          Schedule
                        </button>
                      )}
                    </div>
                  </div>
                  <ProfitTrendChart data={profitTrend} theme={themeColors} />
                </div>
              </div>
            </>
          )}

      </div>

      {/* Schedule Report Modal */}
      <ScheduleReportModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        reportType={selectedReportType}
        theme={themeColors}
      />
    </div>
  );
}
