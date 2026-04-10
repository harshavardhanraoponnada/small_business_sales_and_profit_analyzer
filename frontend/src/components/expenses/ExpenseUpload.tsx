import { useRef } from 'react';
import { Paperclip, UploadCloud, X } from 'lucide-react';
import { AppButton } from '@/components/ui';

interface ExpenseUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export default function ExpenseUpload({ file, onFileChange, disabled = false }: ExpenseUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Receipt (Optional)</label>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            disabled={disabled}
            onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          />

          <AppButton
            variant="secondary"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={16} />
            Choose File
          </AppButton>

          {file ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Paperclip size={14} />
                {file.name}
              </span>
              <AppButton variant="ghost" disabled={disabled} onClick={() => onFileChange(null)}>
                <X size={14} />
                Remove
              </AppButton>
            </>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG, PDF up to 10MB</p>
          )}
        </div>
      </div>
    </div>
  );
}
