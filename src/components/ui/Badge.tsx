import { Badge as ShadcnBadge } from '@/components/shadcn/badge';
import { cn } from '@/lib/utils';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
}

const variantMap: Record<NonNullable<BadgeProps['variant']>, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-slate-700 text-white hover:bg-slate-800',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  warning: 'bg-amber-500 text-slate-950 hover:bg-amber-600',
};

const sizeMap: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

/**
 * Public project badge API with semantic variants and sizes.
 */
export function Badge({
  label,
  variant = 'primary',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <ShadcnBadge className={cn(variantMap[variant], sizeMap[size], className)}>
      {label}
    </ShadcnBadge>
  );
}
