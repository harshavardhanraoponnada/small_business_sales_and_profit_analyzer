import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { formatNumber } from "../../utils/numberFormat";
import { Calendar } from "lucide-react";

const COLORS = {
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

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, theme }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div
        style={{
          backgroundColor: theme.surface,
          border: `2px solid ${theme.accent}`,
          borderRadius: "12px",
          padding: "1rem",
          boxShadow: theme.isDarkMode
            ? "0 8px 24px rgba(0, 0, 0, 0.5)"
            : "0 8px 24px rgba(0, 0, 0, 0.15)",
          zIndex: 1000,
          maxWidth: "250px",
          pointerEvents: "auto"
        }}
        onWheel={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
      >
        <p
          style={{
            margin: "0 0 0.75rem 0",
            fontWeight: "700",
            fontSize: "1rem",
            color: theme.accent
          }}
        >
          {label}
        </p>
        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
          {Object.entries(data)
            .filter(([key]) => key !== "month" && key !== "total")
            .map(([category, value]) => {
              const amount = parseFloat(value);
              if (amount === 0) return null;
              return (
                <div
                  key={category}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.85rem",
                    color: theme.text,
                    marginBottom: "0.5rem",
                    padding: "0.25rem 0",
                    borderBottom: `1px solid ${theme.border}`,
                    lineHeight: "1.4"
                  }}
                >
                  <span style={{ fontWeight: "600", color: COLORS[category] || "#6b7280" }}>
                    {category}
                  </span>
                  <span style={{ fontWeight: "700", marginLeft: "0.5rem" }}>
                    ₹{formatNumber(amount)}
                  </span>
                </div>
              );
            })}
        </div>
        <div
          style={{
            marginTop: "0.75rem",
            paddingTop: "0.75rem",
            borderTop: `2px solid ${theme.accent}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: "800",
            fontSize: "0.95rem"
          }}
        >
          <span style={{ color: theme.text }}>Total:</span>
          <span style={{ color: theme.accent }}>₹{formatNumber(data?.total || 0)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function MonthlyExpenseChart({ monthlyData, theme }) {
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div
        style={{
          backgroundColor: theme.surface,
          borderRadius: "16px",
          padding: "2.5rem",
          border: `1px solid ${theme.border}`,
          textAlign: "center"
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📈</div>
        <h3 style={{ color: theme.text, marginBottom: "0.5rem" }}>
          No monthly data yet
        </h3>
        <p style={{ color: theme.textSecondary, fontSize: "0.9rem" }}>
          Expense trends will appear here over time
        </p>
      </div>
    );
  }

  // Get all unique categories across all months
  const allCategories = new Set();
  monthlyData.forEach((month) => {
    Object.keys(month.categories).forEach((cat) => allCategories.add(cat));
  });
  const categories = Array.from(allCategories);

  // Transform data for stacked bar chart
  const chartData = monthlyData.map((month) => {
    const monthLabel = new Date(month.month + "-01").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short"
    });

    const dataPoint = {
      month: monthLabel,
      total: month.total
    };

    // Add each category as a separate field
    categories.forEach((category) => {
      dataPoint[category] = month.categories[category] || 0;
    });

    return dataPoint;
  });

  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: "16px",
        padding: "2.5rem",
        border: `1px solid ${theme.border}`,
        boxShadow: theme.isDarkMode
          ? "0 8px 32px rgba(0, 0, 0, 0.3)"
          : "0 8px 32px rgba(0, 0, 0, 0.1)"
      }}
    >
      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          marginBottom: "2rem",
          color: theme.text,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}
      >
        <Calendar size={24} />
        Monthly Category-wise Expenses
      </h2>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.border}
            opacity={0.5}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: theme.text, fontSize: 12 }}
            stroke={theme.border}
          />
          <YAxis
            tick={{ fill: theme.text, fontSize: 12 }}
            stroke={theme.border}
            tickFormatter={(value) => `₹${formatNumber(value)}`}
          />
          <Tooltip
            content={<CustomTooltip theme={theme} />}
            cursor={{ fill: `${theme.accent}10` }}
            wrapperStyle={{ outline: "none", zIndex: 1000 }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "20px",
              color: theme.text
            }}
            iconType="circle"
          />

          {/* Render a bar for each category */}
          {categories.map((category) => (
            <Bar
              key={category}
              dataKey={category}
              stackId="a"
              fill={COLORS[category] || "#6b7280"}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Monthly Totals Summary */}
      <div
        style={{
          marginTop: "2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem"
        }}
      >
        {chartData.map((month, index) => (
          <div
            key={index}
            style={{
              padding: "1rem",
              borderRadius: "12px",
              backgroundColor: `${theme.accent}10`,
              border: `1px solid ${theme.border}`,
              textAlign: "center",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${theme.accent}20`;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${theme.accent}10`;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: "600",
                color: theme.textSecondary,
                marginBottom: "0.25rem"
              }}
            >
              {month.month}
            </div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: "800",
                color: theme.text
              }}
            >
              ₹{formatNumber(month.total)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
