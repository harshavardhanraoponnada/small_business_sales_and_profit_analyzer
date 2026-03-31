import type { SelectProps as AppSelectProps } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';

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
  return (
    <div className="space-y-1.5">
      {label ? (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
      ) : null}

      <Select
        value={value == null ? undefined : String(value)}
        onValueChange={(selected) => onChange?.(selected)}
        disabled={disabled}
      >
        <SelectTrigger className={className} aria-invalid={Boolean(error)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
