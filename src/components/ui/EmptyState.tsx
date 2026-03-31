import type { EmptyStateProps } from '@/types';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        {icon || <Inbox className="h-5 w-5" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">{description}</p> : null}
      {action ? (
        <div className="mt-5">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      ) : null}
    </div>
  );
}
