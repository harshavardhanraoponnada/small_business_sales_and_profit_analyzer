import { useEffect, useState, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { formatNumber } from "../utils/numberFormat";

const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#6366f1", "#14b8a6"];

export default function ExpensePieChart({ data, theme }) {
  const [animate, setAnimate] = useState(false);
  const [key, setKey] = useState(0);
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
    handleScroll(); // Check immediately

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!data || data.length === 0) {
    return <p style={{ color: theme?.textSecondary || "var(--textSecondary)" }}>📊 No expenses yet<br />Start adding expenses to see breakdown here.</p>;
  }

  return (
    <div className="card" ref={ref} style={{ background: theme?.surface, color: theme?.text, border: theme ? `1px solid ${theme.border}` : undefined }}>
      <h3 style={{ color: theme?.text }}>Expense Distribution</h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart key={key}>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            outerRadius={100}
            label={({ value }) => `₹${formatNumber(value)}`}
            isAnimationActive={animate}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `₹${formatNumber(value)}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
