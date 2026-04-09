import type { SelectProps as AppSelectProps } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';

const EMPTY_OPTION_SENTINEL = '__EMPTY_OPTION__';

/**
 * Select wrapper with typed options and inline validation message support.
 */
export function AppSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  required,
  disabled,
  className,
}: AppSelectProps) {
  const toSelectValue = (value: string | number | undefined) => {
    if (value == null) return undefined;
    const normalized = String(value);
    return normalized === '' ? EMPTY_OPTION_SENTINEL : normalized;
  };

  const fromSelectValue = (value: string) => {
    return value === EMPTY_OPTION_SENTINEL ? '' : value;
  };

  return (
    <div className="space-y-1.5">
      {label ? (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
      ) : null}

      <Select
        value={toSelectValue(value)}
        onValueChange={(selected) => onChange?.(fromSelectValue(selected))}
        disabled={disabled}
      >
        <SelectTrigger className={className} aria-invalid={Boolean(error)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={toSelectValue(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
