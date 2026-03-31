import { useEffect, useState } from "react";
import api from "../../services/api";
import ExpenseTrendChart from "../../charts/ExpenseTrendChart";
import ExpensePieChart from "../../charts/ExpensePieChart";

export default function ExpenseAnalytics({ theme }) {
  const [range, setRange] = useState("yearly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [trend, setTrend] = useState([]);
  const [distribution, setDistribution] = useState([]);

  useEffect(() => {
    let url = `/reports/expenses?range=${range}`;
    if (range === "custom") {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    api
      .get(url)
      .then(res => {
        setTrend(res.data.trend || []);
        setDistribution(res.data.distribution || []);
      })
      .catch(() => {
        setTrend([]);
        setDistribution([]);
      });
  }, [range, startDate, endDate]);

  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: "12px",
        padding: "1rem",
        marginBottom: "2rem"
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem"
        }}
      >
        <h3 style={{ color: theme.text, margin: 0 }}>
          Expense Analytics
        </h3>

        {range === "custom" && (
          <div style={{ display: "flex", gap: "0.5rem", marginRight: "1rem" }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                background: theme.surface,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: "6px",
                padding: "0.3rem 0.5rem"
              }}
            />
            <span style={{ alignSelf: "center", color: theme.text }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                background: theme.surface,
                color: theme.text,
                border: `1px solid ${theme.border}`,
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
            background: theme.surface,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: "6px",
            padding: "0.3rem 0.5rem"
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

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1rem"
        }}
      >
        <ExpenseTrendChart data={trend} theme={theme} />
        <ExpensePieChart data={distribution} theme={theme} />
      </div>
    </div>
  );
}
