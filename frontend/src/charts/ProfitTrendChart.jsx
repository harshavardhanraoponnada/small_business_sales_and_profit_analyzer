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
import { formatNumber } from "../utils/numberFormat";

export default function ProfitTrendChart({ data, theme }) {
  const [isVisible, setIsVisible] = useState(true);
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
    return <p style={{ color: theme?.textSecondary || "var(--textSecondary)" }}>📊 No profit data yet<br />Start adding sales and expenses to see trends here.</p>;
  }

  return (
    <div className="card" ref={ref} style={{ background: theme?.surface, color: theme?.text, border: theme ? `1px solid ${theme.border}` : undefined }}>
      <h3 style={{ color: theme?.text }}>Profit Trend</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart key={key} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: theme?.text }} />
            <YAxis tick={{ fill: theme?.text }} tickFormatter={formatNumber} />
          <Tooltip formatter={(value) => `₹${formatNumber(value)}`} />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#16a34a"
            strokeWidth={2}
            isAnimationActive={animate}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
