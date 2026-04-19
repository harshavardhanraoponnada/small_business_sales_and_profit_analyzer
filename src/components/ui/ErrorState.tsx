import type { ErrorStateProps } from '@/types';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/shadcn/button';

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/70 dark:bg-red-950/40">
      <AlertTriangle className="mx-auto mb-3 h-7 w-7 text-red-600 dark:text-red-300" aria-hidden="true" />
      <h3 className="text-base font-semibold text-red-900 dark:text-red-100">{title}</h3>
      <p className="mt-2 text-sm text-red-800/90 dark:text-red-200/90">{message}</p>
      {onRetry ? (
        <div className="mt-4">
          <Button variant="outline" onClick={onRetry}>Retry</Button>
        </div>
      ) : null}
    </div>
  );
}
