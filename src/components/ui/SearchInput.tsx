import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => onChange(localValue), debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={localValue}
          onChange={(nextValue) => setLocalValue(nextValue)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {localValue ? (
        <Button variant="outline" size="sm" onClick={() => setLocalValue('')} aria-label="Clear search">
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
