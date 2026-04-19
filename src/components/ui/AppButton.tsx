import { Loader2 } from 'lucide-react';
import type { ButtonProps as AppButtonProps } from '@/types';
import { Button } from '@/components/shadcn/button';

const variantMap: Record<NonNullable<AppButtonProps['variant']>, 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'> = {
  primary: 'default',
  secondary: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
  danger: 'destructive',
};

const sizeMap: Record<NonNullable<AppButtonProps['size']>, 'sm' | 'default' | 'lg'> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

/**
 * Project-level button wrapper with product variants and loading state.
 */
export function AppButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  type = 'button',
  onClick,
}: AppButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={className}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </Button>
  );
}
