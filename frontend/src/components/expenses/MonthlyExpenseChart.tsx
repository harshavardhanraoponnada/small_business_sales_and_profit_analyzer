import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Calendar } from 'lucide-react';
import { formatNumber } from '@/utils/numberFormat';
import { getExpenseCategoryMeta } from '@/utils/expenseCategoryMeta';
import type {
  ExpenseCategoryMetaMap,
  ExpenseThemePalette,
  MonthlyCategoryPoint,
} from './types';

type MonthlyExpenseChartProps = {
  monthlyData: MonthlyCategoryPoint[];
  theme: ExpenseThemePalette;
  categoryMetaMap?: ExpenseCategoryMetaMap;
};

type TooltipRendererProps = {
  active?: boolean;
  payload?: Array<{ payload?: Record<string, unknown> }>;
  label?: string;
  theme: ExpenseThemePalette;
  categoryMetaMap: ExpenseCategoryMetaMap;
};

const toAmount = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const CustomTooltip = ({
  active,
  payload,
  label,
  theme,
  categoryMetaMap,
}: TooltipRendererProps) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0]?.payload || {};

  return (
    <div
      style={{
        backgroundColor: theme.surface,
        border: `2px solid ${theme.accent}`,
        borderRadius: '12px',
        padding: '1rem',
        boxShadow: theme.isDarkMode
          ? '0 8px 24px rgba(0, 0, 0, 0.5)'
          : '0 8px 24px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        maxWidth: '250px',
        pointerEvents: 'auto',
      }}
      onWheel={(event) => event.stopPropagation()}
      onMouseMove={(event) => event.stopPropagation()}
    >
      <p
        style={{
          margin: '0 0 0.75rem 0',
          fontWeight: '700',
          fontSize: '1rem',
          color: theme.accent,
        }}
      >
        {label}
      </p>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {Object.entries(data)
          .filter(([key]) => key !== 'month' && key !== 'total')
          .map(([category, value]) => {
            const amount = toAmount(value);
            const categoryColor = getExpenseCategoryMeta(category, categoryMetaMap).color;
            if (amount === 0) {
              return null;
            }

            return (
              <div
                key={category}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  color: theme.text,
                  marginBottom: '0.5rem',
                  padding: '0.25rem 0',
                  borderBottom: `1px solid ${theme.border}`,
                  lineHeight: '1.4',
                }}
              >
                <span style={{ fontWeight: '600', color: categoryColor }}>{category}</span>
                <span style={{ fontWeight: '700', marginLeft: '0.5rem' }}>
                  ₹{formatNumber(amount)}
                </span>
              </div>
            );
          })}
      </div>
      <div
        style={{
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: `2px solid ${theme.accent}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: '800',
          fontSize: '0.95rem',
        }}
      >
        <span style={{ color: theme.text }}>Total:</span>
        <span style={{ color: theme.accent }}>₹{formatNumber(toAmount(data.total))}</span>
      </div>
    </div>
  );
};

export default function MonthlyExpenseChart({
  monthlyData,
  theme,
  categoryMetaMap = {},
}: MonthlyExpenseChartProps) {
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div
        style={{
          background: theme.isDarkMode
            ? `linear-gradient(160deg, ${theme.surface}, rgba(30,41,59,0.8))`
            : `linear-gradient(160deg, ${theme.surface}, rgba(241,245,249,0.86))`,
          borderRadius: '18px',
          padding: '2.5rem',
          border: `1px solid ${theme.border}`,
          textAlign: 'center',
          boxShadow: theme.isDarkMode
            ? '0 18px 36px rgba(2,6,23,0.48)'
            : '0 14px 30px rgba(15,23,42,0.10)',
        }}
      >
        <div
          style={{
            width: '66px',
            height: '66px',
            margin: '0 auto 1rem',
            borderRadius: '18px',
            border: `1px solid ${theme.accent}45`,
            background: theme.isDarkMode
              ? `linear-gradient(145deg, ${theme.accent}28, rgba(15,23,42,0.55))`
              : `linear-gradient(145deg, ${theme.accent}22, rgba(255,255,255,0.85))`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.isDarkMode
              ? '0 12px 24px rgba(2,6,23,0.42)'
              : '0 10px 22px rgba(15,23,42,0.12)',
          }}
        >
          <BarChart3 size={30} color={theme.accent} />
        </div>
        <h3 style={{ color: theme.text, marginBottom: '0.5rem' }}>No monthly data yet</h3>
        <p style={{ color: theme.textSecondary, fontSize: '0.9rem' }}>
          Expense trends will appear here over time
        </p>
      </div>
    );
  }

  const allCategories = new Set<string>();
  monthlyData.forEach((month) => {
    Object.keys(month.categories).forEach((category) => allCategories.add(category));
  });
  const categories = Array.from(allCategories);

  const chartData = monthlyData.map((month) => {
    const monthLabel = new Date(`${month.month}-01`).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });

    const dataPoint: Record<string, string | number> = {
      month: monthLabel,
      total: toAmount(month.total),
    };

    categories.forEach((category) => {
      dataPoint[category] = toAmount(month.categories[category]);
    });

    return dataPoint;
  });

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: theme.isDarkMode
          ? `linear-gradient(160deg, ${theme.surface}, rgba(30,41,59,0.8))`
          : `linear-gradient(160deg, ${theme.surface}, rgba(241,245,249,0.86))`,
        borderRadius: '18px',
        padding: '2.5rem',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.isDarkMode
          ? '0 18px 36px rgba(2,6,23,0.48)'
          : '0 14px 30px rgba(15,23,42,0.10)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: '-38px',
          top: '-42px',
          width: '160px',
          height: '160px',
          borderRadius: '999px',
          background: `radial-gradient(circle, ${theme.accentSoft || `${theme.accent}25`}, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <h2
        style={{
          fontSize: '1.65rem',
          fontWeight: '800',
          marginBottom: '2rem',
          color: theme.text,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          letterSpacing: '0.01em',
        }}
      >
        <Calendar size={24} />
        Monthly Category Mix
      </h2>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} opacity={0.5} />
          <XAxis dataKey="month" tick={{ fill: theme.text, fontSize: 12 }} stroke={theme.border} />
          <YAxis
            tick={{ fill: theme.text, fontSize: 12 }}
            stroke={theme.border}
            tickFormatter={(value) => `₹${formatNumber(toAmount(value))}`}
          />
          <Tooltip
            content={<CustomTooltip theme={theme} categoryMetaMap={categoryMetaMap} />}
            cursor={{ fill: `${theme.accent}10` }}
            wrapperStyle={{ outline: 'none', zIndex: 1000 }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              color: theme.text,
            }}
            iconType="circle"
          />

          {categories.map((category) => (
            <Bar
              key={category}
              dataKey={category}
              stackId="a"
              fill={getExpenseCategoryMeta(category, categoryMetaMap).color}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div
        style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
        }}
      >
        {chartData.map((month) => (
          <div
            key={String(month.month)}
            style={{
              padding: '1rem',
              borderRadius: '14px',
              backgroundColor: `${theme.accent}10`,
              border: `1px solid ${theme.border}`,
              textAlign: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 8px 16px rgba(15,23,42,0.08)',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = `${theme.accent}20`;
              event.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = `${theme.accent}10`;
              event.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: theme.textSecondary,
                marginBottom: '0.25rem',
              }}
            >
              {month.month}
            </div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: '800',
                color: theme.text,
              }}
            >
              ₹{formatNumber(toAmount(month.total))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
