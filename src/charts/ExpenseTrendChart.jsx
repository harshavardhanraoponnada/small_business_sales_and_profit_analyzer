import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
import { formatNumber } from "../utils/numberFormat";

export default function ExpenseTrendChart({ data, theme }) {
  return (
    <div className="card" style={{ background: theme?.surface, color: theme?.text, border: theme ? `1px solid ${theme.border}` : undefined }}>
      <h4 style={{ color: theme?.text }}>Expense Trend</h4>

      {(!data || data.length === 0) ? (
        <p style={{ textAlign: "center", padding: "2rem", color: theme?.textSecondary || "var(--textSecondary)" }}>No expense data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: theme?.text }} />
            <YAxis tick={{ fill: theme?.text }} tickFormatter={formatNumber} />
            <Tooltip formatter={(value) => `₹${formatNumber(value)}`} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#dc2626"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
