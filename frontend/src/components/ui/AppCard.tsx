import type { CardProps as AppCardProps } from '@/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/shadcn/card';
import { cn } from '@/lib/utils';

const variantClasses: Record<NonNullable<AppCardProps['variant']>, string> = {
  default: '',
  bordered: 'border-2',
  elevated: 'shadow-lg',
};

/**
 * Card wrapper that standardizes variant styling and slot structure.
 */
export function AppCard({ header, footer, children, variant = 'default', className }: AppCardProps) {
  return (
    <Card className={cn(variantClasses[variant], className)}>
      {header ? <CardHeader>{header}</CardHeader> : null}
      <CardContent>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
