import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
