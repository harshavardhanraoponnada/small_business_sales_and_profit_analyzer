import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IndianRupee, TrendingUp } from 'lucide-react';
import { formatNumber } from '@/utils/numberFormat';
import { getExpenseCategoryMeta } from '@/utils/expenseCategoryMeta';
import type {
  CategoryAmount,
  ExpenseCategoryMetaMap,
  ExpenseThemePalette,
} from './types';

type CategoryBreakdownProps = {
  categoryData: CategoryAmount[];
  theme: ExpenseThemePalette;
  categoryMetaMap?: ExpenseCategoryMetaMap;
  dateFilterStart?: string;
  dateFilterEnd?: string;
  onDateFilterStartChange?: (value: string) => void;
  onDateFilterEndChange?: (value: string) => void;
  onClearDateFilter?: () => void;
};

export default function CategoryBreakdown({
  categoryData,
  theme,
  categoryMetaMap = {},
  dateFilterStart = '',
  dateFilterEnd = '',
  onDateFilterStartChange = () => undefined,
  onDateFilterEndChange = () => undefined,
  onClearDateFilter = () => undefined,
}: CategoryBreakdownProps) {
  const hasData = Array.isArray(categoryData) && categoryData.length > 0;
  const totalAmount = categoryData.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const sortedData = hasData
    ? [...categoryData].sort((left, right) => Number(right.amount || 0) - Number(left.amount || 0))
    : [];

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
          right: '-40px',
          top: '-44px',
          width: '170px',
          height: '170px',
          borderRadius: '999px',
          background: `radial-gradient(circle, ${theme.accentSoft || `${theme.accent}25`}, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            fontSize: '1.65rem',
            fontWeight: '800',
            color: theme.text,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          <TrendingUp size={24} />
          Category Spend Distribution
        </h2>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="date"
            value={dateFilterStart}
            onChange={(event) => onDateFilterStartChange(event.target.value)}
            placeholder="Start Date"
            style={{
              padding: '0.52rem 0.78rem',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.surface,
              color: theme.text,
              fontSize: '0.84rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onFocus={(event) => {
              event.currentTarget.style.borderColor = theme.accent;
            }}
            onBlur={(event) => {
              event.currentTarget.style.borderColor = theme.border;
            }}
          />

          <span style={{ color: theme.textSecondary, fontWeight: '600' }}>to</span>

          <input
            type="date"
            value={dateFilterEnd}
            onChange={(event) => onDateFilterEndChange(event.target.value)}
            placeholder="End Date"
            style={{
              padding: '0.52rem 0.78rem',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.surface,
              color: theme.text,
              fontSize: '0.84rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onFocus={(event) => {
              event.currentTarget.style.borderColor = theme.accent;
            }}
            onBlur={(event) => {
              event.currentTarget.style.borderColor = theme.border;
            }}
          />

          {dateFilterStart || dateFilterEnd ? (
            <button
              onClick={onClearDateFilter}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: '999px',
                border: `1px solid ${theme.border}`,
                backgroundColor: `${theme.error}10`,
                color: theme.error,
                fontWeight: '700',
                fontSize: '0.8rem',
                letterSpacing: '0.01em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = `${theme.error}20`;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = `${theme.error}10`;
              }}
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2.5rem',
        }}
      >
        <div
          style={{
            background: theme.isDarkMode
              ? `linear-gradient(180deg, ${theme.accent}18, rgba(15,23,42,0.55))`
              : `linear-gradient(180deg, ${theme.accent}10, rgba(248,250,252,0.85))`,
            borderRadius: '16px',
            padding: '2rem',
            border: `1px solid ${theme.accent}30`,
          }}
        >
          {hasData ? (
            <ResponsiveContainer width="100%" height={600}>
              <BarChart data={sortedData} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} opacity={0.5} />
                <XAxis
                  type="number"
                  tick={{ fill: theme.text, fontSize: 13, fontWeight: 600 }}
                  stroke={theme.border}
                  tickFormatter={(value) => `₹${formatNumber(Number(value || 0))}`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: theme.text, fontSize: 13, fontWeight: 600 }}
                  stroke={theme.border}
                  width={120}
                />
                <Tooltip
                  formatter={(value) => [`₹${formatNumber(Number(value || 0))}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: theme.isDarkMode ? 'rgba(15,23,42,0.96)' : '#ffffff',
                    border: `2px solid ${theme.accent}`,
                    borderRadius: '12px',
                    color: theme.text,
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    boxShadow: theme.isDarkMode
                      ? '0 10px 22px rgba(2,6,23,0.62)'
                      : '0 8px 16px rgba(0, 0, 0, 0.15)',
                  }}
                  labelStyle={{ color: theme.text, fontWeight: 700 }}
                  itemStyle={{ color: theme.text, fontWeight: 600 }}
                  cursor={{ fill: `${theme.accent}15` }}
                />
                <Bar dataKey="amount" radius={[0, 12, 12, 0]}>
                  {sortedData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.category}-${index}`}
                      fill={getExpenseCategoryMeta(entry.category, categoryMetaMap).color}
                      opacity={0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                minHeight: '220px',
                borderRadius: '14px',
                border: `1px dashed ${theme.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                textAlign: 'center',
                color: theme.textSecondary,
                padding: '1rem',
              }}
            >
              <TrendingUp size={26} color={theme.accent} />
              <div style={{ fontWeight: 700, color: theme.text }}>No data for selected date range</div>
              <div style={{ fontSize: '0.9rem' }}>Adjust the date filters to view category distribution.</div>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
          }}
        >
          {hasData ? (
            sortedData.map((item) => {
              const itemAmount = Number(item.amount || 0);
              const percentage = totalAmount > 0 ? ((itemAmount / totalAmount) * 100).toFixed(1) : '0.0';
              const categoryColor = getExpenseCategoryMeta(item.category, categoryMetaMap).color;

              return (
                <div
                  key={item.category}
                  style={{
                    padding: '1rem',
                    borderRadius: '14px',
                    backgroundColor: `${categoryColor}10`,
                    border: `1px solid ${categoryColor}30`,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 8px 16px rgba(15,23,42,0.08)',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform = 'translateX(3px)';
                    event.currentTarget.style.backgroundColor = `${categoryColor}20`;
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = 'translateX(0)';
                    event.currentTarget.style.backgroundColor = `${categoryColor}10`;
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: categoryColor,
                        }}
                      />
                      <span
                        style={{
                          fontWeight: '700',
                          color: theme.text,
                          fontSize: '0.95rem',
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                    <span
                      style={{
                        fontWeight: '700',
                        color: categoryColor,
                        fontSize: '1rem',
                      }}
                    >
                      {percentage}%
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: theme.border,
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: categoryColor,
                          borderRadius: '4px',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontWeight: '700',
                        color: theme.text,
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ₹{formatNumber(itemAmount)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                borderRadius: '14px',
                padding: '1rem',
                border: `1px dashed ${theme.border}`,
                color: theme.textSecondary,
                fontWeight: 600,
                gridColumn: '1 / -1',
                textAlign: 'center',
              }}
            >
              No category totals available for this filter window.
            </div>
          )}

          <div
            style={{
              padding: '1.2rem',
              borderRadius: '14px',
              backgroundColor: `${theme.accent}15`,
              border: `2px solid ${theme.accent}`,
              marginTop: '0.5rem',
              gridColumn: '1 / -1',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontWeight: '700',
                  color: theme.text,
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <IndianRupee size={18} />
                Total Expenses
              </span>
              <span
                style={{
                  fontWeight: '800',
                  color: theme.accent,
                  fontSize: '1.4rem',
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
