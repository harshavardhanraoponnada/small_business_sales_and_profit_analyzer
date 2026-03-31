import { Loader2 } from 'lucide-react';
import type { LoadingStateProps } from '@/types';

export function LoadingState({ type = 'spinner', variant = 'card' }: LoadingStateProps) {
  if (type === 'spinner') {
    return (
      <div className="flex w-full items-center justify-center py-10" role="status" aria-live="polite">
        <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div className="flex items-center justify-center gap-1 py-8" role="status" aria-live="polite">
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.2s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.1s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-3" aria-hidden="true">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return <div className="h-64 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" aria-hidden="true" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="h-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      ))}
    </div>
  );
}
