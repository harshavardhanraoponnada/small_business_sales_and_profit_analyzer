import type { ChangeEvent, FocusEvent } from 'react';
import type { InputProps as AppInputProps } from '@/types';
import { Input } from '@/components/shadcn/input';

/**
 * Input wrapper with label, helper text, and validation state support.
 */
export function AppInput({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  hint,
  required,
  disabled,
  type = 'text',
  className,
}: AppInputProps) {
  const helperText = error || hint;

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (type !== 'number') return;

    const normalized = String(value ?? '').trim();
    if (normalized === '0' || normalized === '0.0' || normalized === '0.00') {
      event.target.select();
    }
  };

  return (
    <div className="space-y-1.5">
      {label ? (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
      ) : null}

      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value)}
        onFocus={handleFocus}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={className}
      />

      {helperText ? (
        <p className={`text-xs ${error ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
