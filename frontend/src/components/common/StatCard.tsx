import { memo, isValidElement, cloneElement, type ReactElement, type ReactNode } from 'react';
import cardStyles from '@/css/cards.module.css';

type ChangeType = 'positive' | 'negative';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  onClick?: () => void;
  change?: string;
  changeType?: ChangeType;
  icon?: ReactNode;
  extraContent?: ReactNode;
}

/**
 * Reusable metric card for dashboards and summaries.
 * Accepts both `trend` and legacy `change` props for compatibility.
 */
const StatCard = memo(function StatCard({
  title,
  value,
  trend,
  onClick,
  change,
  changeType = 'positive',
  icon,
  extraContent,
}: StatCardProps) {
  const trendText = trend ?? change;
  const iconNode = typeof icon === 'string'
    ? icon
    : isValidElement(icon)
      ? cloneElement(icon as ReactElement<{ size?: number }>, { size: 24 })
      : icon;

  return (
    <div
      className={cardStyles.card}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="m-0 text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
        <span className="flex items-center justify-center text-2xl">{iconNode}</span>
      </div>

      <div className="mb-1 text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</div>

      {trendText && (
        <div className={`text-sm font-semibold ${changeType === 'positive' ? 'text-emerald-500' : 'text-red-500'}`}>
          {trendText}
        </div>
      )}

      {extraContent && <div className="mt-2">{extraContent}</div>}
    </div>
  );
});

export default StatCard;
