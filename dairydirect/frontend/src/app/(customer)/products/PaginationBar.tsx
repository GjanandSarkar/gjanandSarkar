'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  page: number;
  hasMore: boolean;
  total: number;
  pageSize: number;
  /** Extra class names for the root container. */
  className?: string;
}

/**
 * URL-driven prev/next paginator.
 *
 * Works with the existing URL query params — just bumps `page` in the current
 * URL, preserving all other filters (category, q, sort, etc.).
 *
 * Renders plain <Link> elements so it degrades gracefully if JS is off.
 */
export default function PaginationBar({
  page,
  hasMore,
  total,
  pageSize,
  className = '',
}: PaginationBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** Build a URL with the given page number, keeping all other params. */
  function pageUrl(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) {
      params.delete('page');
    } else {
      params.set('page', String(p));
    }
    const qs = params.toString();
    return `${pathname}${qs ? '?' + qs : ''}`;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const hasPrev = page > 1;

  if (!hasPrev && !hasMore) return null; // single page — nothing to show

  return (
    <nav
      aria-label="Product pages"
      className={`flex items-center justify-between gap-4 py-4 ${className}`}
    >
      {/* Range label */}
      <p className="text-xs text-foreground-muted tabular-nums hidden sm:block">
        {total > 0 ? (
          <>
            Showing <strong className="text-foreground">{start}–{end}</strong> of{' '}
            <strong className="text-foreground">{total}</strong>
          </>
        ) : null}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2 ml-auto">
        {hasPrev ? (
          <Link
            href={pageUrl(page - 1)}
            aria-label="Previous page"
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-border bg-surface text-xs font-medium text-foreground transition-colors hover:bg-surface-muted active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Previous</span>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-border bg-surface text-xs font-medium text-foreground-muted opacity-40 cursor-not-allowed select-none">
            <ChevronLeft className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Previous</span>
          </span>
        )}

        <span className="text-xs font-medium text-foreground tabular-nums px-2">
          Page {page}
        </span>

        {hasMore ? (
          <Link
            href={pageUrl(page + 1)}
            aria-label="Next page"
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-border bg-surface text-xs font-medium text-foreground transition-colors hover:bg-surface-muted active:scale-95"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" aria-hidden />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-border bg-surface text-xs font-medium text-foreground-muted opacity-40 cursor-not-allowed select-none">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
