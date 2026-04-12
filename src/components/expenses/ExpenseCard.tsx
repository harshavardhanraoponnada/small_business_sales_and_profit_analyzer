import type { CSSProperties } from 'react';
import { Calendar, FileText, Paperclip, Tag } from 'lucide-react';
import { formatNumber } from '@/utils/numberFormat';
import { getExpenseCategoryMeta } from '@/utils/expenseCategoryMeta';
import type { ExpenseCategoryMetaMap, ExpenseLike, ExpenseThemePalette } from './types';
import styles from './ExpenseCard.module.css';

const UPLOAD_BASE_URL =
  import.meta.env.VITE_UPLOAD_BASE_URL ||
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const defaultTheme: ExpenseThemePalette = {
  background: '#f8fafc',
  surface: 'rgba(255,255,255,0.92)',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: 'rgba(148,163,184,0.34)',
  accent: '#0284c7',
  error: '#ef4444',
  success: '#10b981',
  accentSoft: 'rgba(14,165,233,0.16)',
  isDarkMode: false,
};

type ExpenseCardProps = {
  expense: ExpenseLike;
  theme?: ExpenseThemePalette;
  categoryMetaMap?: ExpenseCategoryMetaMap;
};

export default function ExpenseCard({
  expense,
  theme = defaultTheme,
  categoryMetaMap = {},
}: ExpenseCardProps) {
  const categoryMeta = getExpenseCategoryMeta(expense.category, categoryMetaMap);
  const categoryColor = categoryMeta.color;

  const rootStyle = {
    '--expense-card-surface': theme.surface,
    '--expense-card-overlay': theme.isDarkMode ? 'rgba(30,41,59,0.78)' : 'rgba(241,245,249,0.86)',
    '--expense-card-border': theme.border,
    '--expense-card-shadow': theme.isDarkMode
      ? '0 16px 34px rgba(2, 6, 23, 0.42)'
      : '0 12px 28px rgba(15, 23, 42, 0.10)',
    '--expense-card-shadow-hover': theme.isDarkMode
      ? '0 20px 36px rgba(2, 6, 23, 0.52)'
      : '0 18px 34px rgba(15, 23, 42, 0.16)',
    '--expense-card-accent': theme.accent,
    '--expense-card-receipt-shadow': `0 10px 20px ${theme.accent}40`,
  } as CSSProperties;

  return (
    <div className={styles.card} style={rootStyle}>
      <div
        className={styles.glow}
        style={{ background: `radial-gradient(circle, ${categoryColor}30, transparent 70%)` }}
        aria-hidden="true"
      />
      <div className={styles.indicator} style={{ backgroundColor: categoryColor }} aria-hidden="true" />

      <div className={styles.header}>
        <div className={styles.categoryWrap}>
          <div className={styles.categoryIcon}>{categoryMeta.icon}</div>
          <div>
            <div
              className={styles.categoryChip}
              style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
            >
              <Tag size={14} />
              {expense.category || 'Other'}
            </div>
          </div>
        </div>

        <div className={styles.amount} style={{ color: theme.text }}>
          ₹{formatNumber(Number(expense.amount || 0))}
        </div>
      </div>

      <div className={styles.description} style={{ color: theme.text }}>
        <FileText size={16} style={{ marginTop: '0.25rem', flexShrink: 0 }} />
        <p className={styles.descriptionText} style={{ color: theme.textSecondary }}>
          {expense.description || 'No description'}
        </p>
      </div>

      <div className={styles.footer}>
        <div className={styles.date} style={{ color: theme.textSecondary }}>
          <Calendar size={14} />
          {expense.date
            ? new Date(expense.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : 'No date'}
        </div>

        {expense.file ? (
          <a
            href={`${UPLOAD_BASE_URL}/uploads/${expense.file}`}
            target="_blank"
            rel="noreferrer"
            className={styles.receiptLink}
          >
            <Paperclip size={14} />
            Receipt
          </a>
        ) : null}
      </div>
    </div>
  );
}
