import type { PaginationProps } from '@/types';
import { Button } from '@/components/shadcn/button';

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
}: PaginationProps) {
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Page {safePage} of {Math.max(totalPages, 1)}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={loading || safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
