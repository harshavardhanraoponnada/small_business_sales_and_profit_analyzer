import { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
import api from "../services/api";
import { formatNumber } from "../utils/numberFormat";

export default function SalesTrendChart({ data, theme }) {
  const [isVisible, setIsVisible] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [key, setKey] = useState(0);
  /* ================= CHART STATES ================= */
  const [range, setRange] = useState("yearly");
  const [trendData, setTrendData] = useState(data || []);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setAnimate(true);
        setKey(1);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let url = `/reports/sales-trend?range=${range}`;
    if (range === "custom") {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    api
      .get(url)
      .then(res => {
        setTrendData(res.data || []);
      })
      .catch(() => {
        setTrendData([]);
      });
  }, [range, startDate, endDate]);

  return (
    <div className="card" ref={ref} style={{ background: theme?.surface, color: theme?.text, border: theme ? `1px solid ${theme.border}` : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ color: theme?.text }}>Sales Trend</h3>
        {range === "custom" && (
          <div style={{ display: "flex", gap: "0.5rem", marginRight: "1rem" }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                background: theme?.surface,
                color: theme?.text,
                border: `1px solid ${theme?.border}`,
                borderRadius: "6px",
                padding: "0.3rem 0.5rem"
              }}
            />
            <span style={{ alignSelf: "center", color: theme?.text }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                background: theme?.surface,
                color: theme?.text,
                border: `1px solid ${theme?.border}`,
                borderRadius: "6px",
                padding: "0.3rem 0.5rem"
              }}
            />
          </div>
        )}

        <select
          value={range}
          onChange={e => setRange(e.target.value)}
          style={{
            background: theme?.surface,
            color: theme?.text,
            border: `1px solid ${theme?.border}`,
            borderRadius: "6px",
            padding: "0.3rem 0.5rem",
            fontSize: "0.9rem"
          }}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="max">Max</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {(!trendData || trendData.length === 0) ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--textSecondary)" }}>
          <p>📊 No sales yet<br />Start adding sales to see trends here.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart key={key} data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: theme?.text }} />
            <YAxis
              tick={{ fill: theme?.text }}
              tickFormatter={formatNumber}
              width={90}
            />
            <Tooltip formatter={(value) => `₹${formatNumber(value)}`} />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#2563eb"
              strokeWidth={2}
              isAnimationActive={animate}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
