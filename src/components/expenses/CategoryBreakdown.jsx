import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatNumber } from "../../utils/numberFormat";
import { TrendingUp, IndianRupee } from "lucide-react";

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

export default function CategoryBreakdown({ 
  categoryData, 
  theme,
  dateFilterStart = "",
  dateFilterEnd = "",
  onDateFilterStartChange = () => {},
  onDateFilterEndChange = () => {},
  onClearDateFilter = () => {}
}) {
  if (!categoryData || categoryData.length === 0) {
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
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
        <h3 style={{ color: theme.text, marginBottom: "0.5rem" }}>
          No expense data yet
        </h3>
        <p style={{ color: theme.textSecondary, fontSize: "0.9rem" }}>
          Start adding expenses to see category breakdown
        </p>
      </div>
    );
  }

  const totalAmount = categoryData.reduce((sum, item) => sum + item.amount, 0);

  // Sort by amount descending
  const sortedData = [...categoryData].sort((a, b) => b.amount - a.amount);

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          gap: "1rem",
          flexWrap: "wrap"
        }}
      >
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: "700",
            color: theme.text,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            margin: 0
          }}
        >
          <TrendingUp size={24} />
          Category-wise Expense Distribution
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
            onChange={(e) => onDateFilterStartChange(e.target.value)}
            placeholder="Start Date"
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.surface,
              color: theme.text,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onFocus={(e) => e.target.style.borderColor = theme.accent}
            onBlur={(e) => e.target.style.borderColor = theme.border}
          />

          <span style={{ color: theme.textSecondary, fontWeight: "600" }}>to</span>

          <input
            type="date"
            value={dateFilterEnd}
            onChange={(e) => onDateFilterEndChange(e.target.value)}
            placeholder="End Date"
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.surface,
              color: theme.text,
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onFocus={(e) => e.target.style.borderColor = theme.accent}
            onBlur={(e) => e.target.style.borderColor = theme.border}
          />

          {(dateFilterStart || dateFilterEnd) && (
            <button
              onClick={onClearDateFilter}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                backgroundColor: `${theme.error}10`,
                color: theme.error,
                fontWeight: "600",
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = `${theme.error}20`;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = `${theme.error}10`;
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "2.5rem"
        }}
      >
        {/* Bar Chart - Full Width */}
        <div
          style={{
            backgroundColor: `${theme.accent}05`,
            borderRadius: "16px",
            padding: "2rem",
            border: `2px solid ${theme.accent}20`
          }}
        >
          <ResponsiveContainer width="100%" height={600}>
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.border}
                opacity={0.5}
              />
              <XAxis 
                type="number"
                tick={{ fill: theme.text, fontSize: 13, fontWeight: 600 }}
                stroke={theme.border}
                tickFormatter={(value) => `₹${formatNumber(value)}`}
              />
              <YAxis 
                type="category"
                dataKey="category"
                tick={{ fill: theme.text, fontSize: 13, fontWeight: 600 }}
                stroke={theme.border}
                width={120}
              />
              <Tooltip
                formatter={(value) => [`₹${formatNumber(value)}`, 'Amount']}
                contentStyle={{
                  backgroundColor: theme.surface,
                  border: `2px solid ${theme.accent}`,
                  borderRadius: "12px",
                  color: theme.text,
                  padding: "12px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  boxShadow: theme.isDarkMode
                    ? "0 8px 16px rgba(0, 0, 0, 0.4)"
                    : "0 8px 16px rgba(0, 0, 0, 0.15)"
                }}
                cursor={{ fill: `${theme.accent}15` }}
              />
              <Bar dataKey="amount" radius={[0, 12, 12, 0]}>
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.category] || "#6b7280"}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category List - Below Chart */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          {sortedData.map((item, index) => {
            const percentage = ((item.amount / totalAmount) * 100).toFixed(1);
            const categoryColor = COLORS[item.category] || "#6b7280";

            return (
              <div
                key={index}
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  backgroundColor: `${categoryColor}10`,
                  border: `1px solid ${categoryColor}30`,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(4px)";
                  e.currentTarget.style.backgroundColor = `${categoryColor}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.backgroundColor = `${categoryColor}10`;
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: categoryColor
                      }}
                    />
                    <span
                      style={{
                        fontWeight: "700",
                        color: theme.text,
                        fontSize: "0.95rem"
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <span
                    style={{
                      fontWeight: "700",
                      color: categoryColor,
                      fontSize: "1rem"
                    }}
                  >
                    {percentage}%
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem"
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      backgroundColor: theme.border,
                      borderRadius: "4px",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: "100%",
                        backgroundColor: categoryColor,
                        borderRadius: "4px",
                        transition: "width 0.5s ease"
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontWeight: "700",
                      color: theme.text,
                      fontSize: "0.95rem",
                      whiteSpace: "nowrap"
                    }}
                  >
                    ₹{formatNumber(item.amount)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div
            style={{
              padding: "1.2rem",
              borderRadius: "12px",
              backgroundColor: `${theme.accent}15`,
              border: `2px solid ${theme.accent}`,
              marginTop: "0.5rem",
              gridColumn: "1 / -1"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span
                style={{
                  fontWeight: "700",
                  color: theme.text,
                  fontSize: "1.1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <IndianRupee size={18} />
                Total Expenses
              </span>
              <span
                style={{
                  fontWeight: "800",
                  color: theme.accent,
                  fontSize: "1.4rem"
                }}
              >
                ₹{formatNumber(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
