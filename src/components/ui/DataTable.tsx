import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { DataTableProps } from '@/types';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Pagination } from './Pagination';

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  error,
  onSort,
  onRowClick,
  onSelectionChange,
  selectable,
  pagination,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const sortedRows = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (aValue === bValue) return 0;

      const result = aValue > bValue ? 1 : -1;
      return sortOrder === 'asc' ? result : -result;
    });
  }, [data, sortKey, sortOrder]);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;

    const nextOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortOrder(nextOrder);
    onSort?.(key, nextOrder);
  };

  const toggleRowSelection = (index: number, row: T) => {
    const next = new Set(selectedRows);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedRows(next);
    onSelectionChange?.(sortedRows.filter((_, rowIndex) => next.has(rowIndex)));
  };

  const toggleAll = () => {
    if (selectedRows.size === sortedRows.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
      return;
    }

    const allRows = new Set(sortedRows.map((_, index) => index));
    setSelectedRows(allRows);
    onSelectionChange?.(sortedRows);
  };

  const toggleExpanded = (index: number) => {
    const next = new Set(expandedRows);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setExpandedRows(next);
  };

  if (loading) return <LoadingState type="skeleton" variant="table" />;
  if (error) return <ErrorState message={error} />;
  if (!sortedRows.length) return <EmptyState title="No records found" description="Try changing your filters or search." />;

  const primaryColumns = columns.slice(0, 2);
  const secondaryColumns = columns.slice(2);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              {selectable ? (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={selectedRows.size > 0 && selectedRows.size === sortedRows.length}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600"
                  />
                </th>
              ) : null}
              {columns.map((column) => {
                const key = String(column.key);
                const isActive = sortKey === key;
                const SortIcon = !column.sortable ? null : !isActive ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown;

                return (
                  <th
                    key={key}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(key, column.sortable)}
                      className="inline-flex items-center gap-1 disabled:cursor-default"
                      disabled={!column.sortable}
                    >
                      <span>{column.label}</span>
                      {SortIcon ? <SortIcon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950/40">
            {sortedRows.map((row, index) => (
              <tr
                key={index}
                className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selectable ? (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select row ${index + 1}`}
                      checked={selectedRows.has(index)}
                      onChange={() => toggleRowSelection(index, row)}
                      onClick={(event) => event.stopPropagation()}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600"
                    />
                  </td>
                ) : null}
                {columns.map((column) => {
                  const key = String(column.key);
                  const value = row[column.key];
                  return (
                    <td key={key} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                      {column.render ? column.render(value, row) : String(value ?? '-')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {sortedRows.map((row, index) => {
          const isExpanded = expandedRows.has(index);
          return (
            <article
              key={index}
              className={`rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/40 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  {primaryColumns.map((column) => {
                    const key = String(column.key);
                    const value = row[column.key];
                    return (
                      <div key={key}>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {column.label}
                        </div>
                        <div className="truncate text-sm text-slate-800 dark:text-slate-100">
                          {column.render ? column.render(value, row) : String(value ?? '-')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectable ? (
                  <input
                    type="checkbox"
                    aria-label={`Select row ${index + 1}`}
                    checked={selectedRows.has(index)}
                    onChange={() => toggleRowSelection(index, row)}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600"
                  />
                ) : null}
              </div>

              {secondaryColumns.length ? (
                <>
                  <button
                    type="button"
                    className="mt-1 text-xs font-medium text-primary-600 dark:text-primary-400"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleExpanded(index);
                    }}
                  >
                    {isExpanded ? 'Show less' : `Show ${secondaryColumns.length} more`}
                  </button>
                  {isExpanded ? (
                    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                      {secondaryColumns.map((column) => {
                        const key = String(column.key);
                        const value = row[column.key];
                        return (
                          <div key={key} className="grid grid-cols-2 gap-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              {column.label}
                            </div>
                            <div className="text-right text-sm text-slate-700 dark:text-slate-200">
                              {column.render ? column.render(value, row) : String(value ?? '-')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : null}
            </article>
          );
        })}
      </div>

      {pagination ? (
        <div className="border-t border-slate-200 px-4 dark:border-slate-800">
          <Pagination
            currentPage={pagination.page}
            totalPages={Math.ceil(pagination.total / pagination.limit) || 1}
            onPageChange={pagination.onPageChange}
          />
        </div>
      ) : null}
    </div>
  );
}
