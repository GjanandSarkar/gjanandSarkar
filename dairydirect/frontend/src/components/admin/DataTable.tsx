'use client';

import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  AlertCircle, 
  RefreshCw, 
  Inbox
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string;
  isLoading?: boolean;
  error?: string | Error | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  bulkActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor = (item, idx) => item.id?.toString() || idx.toString(),
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching this criteria or search filter.',
  emptyAction,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
  footer,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Sorting
  const handleHeaderSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [data, sortKey, sortDirection]);

  // Selection
  const allIds = useMemo(() => data.map((item, idx) => keyExtractor(item, idx)), [data, keyExtractor]);
  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const clearSelection = () => {
    if (onSelectionChange) onSelectionChange([]);
  };

  // Error State
  if (error) {
    return (
      <div className="p-8 rounded-[var(--radius-xl)] border border-border bg-surface text-center">
        <EmptyState
          icon={<AlertCircle className="w-8 h-8 text-danger" />}
          title="Error Loading Records"
          description={typeof error === 'string' ? error : error.message || 'Could not fetch data table.'}
          action={
            onRetry ? (
              <Button variant="navy" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                Try Again
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* ─── Bulk Action Floating / Sliding Bar ─── */}
      {selectable && selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-2.5 px-4 bg-secondary text-on-secondary rounded-[var(--radius-lg)] shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="tabular">{selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected</span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Clear
            </button>
          </div>
          {bulkActions && (
            <div className="flex items-center gap-2">
              {bulkActions(selectedIds, clearSelection)}
            </div>
          )}
        </div>
      )}

      {/* ─── Desktop Table (md+) ─── */}
      <div className="hidden md:block rounded-[var(--radius-xl)] border border-border bg-surface overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Header */}
            <thead>
              <tr className="border-b border-border bg-surface-muted/60 sticky top-0 z-10">
                {selectable && (
                  <th className="w-10 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isSomeSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="rounded border-border text-secondary focus:ring-secondary/20 cursor-pointer"
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {columns.map((col) => {
                  const isSorted = sortKey === col.key;
                  const sortAria = isSorted
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined;

                  return (
                    <th
                      key={col.key}
                      aria-sort={sortAria}
                      style={{ width: col.width }}
                      className={cn(
                        'px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-foreground-muted select-none whitespace-nowrap',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.sortable && 'cursor-pointer hover:text-foreground'
                      )}
                      onClick={() => col.sortable && handleHeaderSort(col.key)}
                    >
                      <div
                        className={cn(
                          'inline-flex items-center gap-1.5',
                          col.align === 'right' && 'flex-row-reverse'
                        )}
                      >
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-foreground-muted/60">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-secondary" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-secondary" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-border">
              {isLoading ? (
                // 8 Skeleton loading rows with matching column widths
                Array.from({ length: 8 }).map((_, rIdx) => (
                  <tr key={`skel-row-${rIdx}`} className="h-10">
                    {selectable && (
                      <td className="px-3 py-2 text-center">
                        <Skeleton className="w-4 h-4 rounded mx-auto" />
                      </td>
                    )}
                    {columns.map((col, cIdx) => (
                      <td key={`skel-col-${cIdx}`} className="px-4 py-2">
                        <Skeleton className="h-4 w-3/4 rounded-[var(--radius-sm)]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="p-12 text-center"
                  >
                    <EmptyState
                      icon={<Inbox className="w-8 h-8 text-foreground-muted" />}
                      title={emptyTitle}
                      description={emptyDescription}
                      action={emptyAction}
                    />
                  </td>
                </tr>
              ) : (
                sortedData.map((item, index) => {
                  const id = keyExtractor(item, index);
                  const isSelected = selectedIds.includes(id);

                  return (
                    <tr
                      key={id}
                      onClick={() => onRowClick && onRowClick(item)}
                      className={cn(
                        'h-10 hover:bg-surface-muted/60 transition-colors',
                        onRowClick && 'cursor-pointer',
                        isSelected && 'bg-secondary/5'
                      )}
                    >
                      {selectable && (
                        <td className="w-10 px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelectRow(id, e as any)}
                            className="rounded border-border text-secondary focus:ring-secondary/20 cursor-pointer"
                            aria-label={`Select row ${id}`}
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'px-4 py-2 text-xs text-foreground whitespace-nowrap',
                            col.align === 'right' && 'text-right',
                            col.align === 'center' && 'text-center'
                          )}
                        >
                          {col.render ? col.render(item, index) : item[col.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Footer Summary */}
            {footer && (
              <tfoot>
                <tr className="border-t border-border bg-surface-muted/40 font-semibold text-xs text-foreground">
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-2.5">
                    {footer}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ─── Mobile Stacked Cards (<md) ─── */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Card key={`m-skel-${idx}`} className="p-4 space-y-2">
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/3 rounded" />
            </Card>
          ))
        ) : sortedData.length === 0 ? (
          <Card className="p-8 text-center">
            <EmptyState
              icon={<Inbox className="w-8 h-8 text-foreground-muted" />}
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          </Card>
        ) : (
          sortedData.map((item, index) => {
            const id = keyExtractor(item, index);
            const isSelected = selectedIds.includes(id);

            return (
              <Card
                key={`m-card-${id}`}
                onClick={() => onRowClick && onRowClick(item)}
                className={cn(
                  'p-4 space-y-2.5 relative transition-colors',
                  onRowClick && 'cursor-pointer active:bg-surface-muted',
                  isSelected && 'border-secondary/40 ring-1 ring-secondary/20'
                )}
              >
                {selectable && (
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-[11px] font-mono text-foreground-muted">#{id}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => toggleSelectRow(id, e as any)}
                      className="rounded border-border text-secondary focus:ring-secondary/20 cursor-pointer"
                    />
                  </div>
                )}
                {columns.map((col) => (
                  <div key={`m-col-${col.key}`} className="flex items-start justify-between text-xs gap-2">
                    <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider shrink-0">
                      {col.header}
                    </span>
                    <div className={cn('text-right text-foreground min-w-0 font-medium', col.align === 'center' && 'text-center')}>
                      {col.render ? col.render(item, index) : item[col.key] ?? '—'}
                    </div>
                  </div>
                ))}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
