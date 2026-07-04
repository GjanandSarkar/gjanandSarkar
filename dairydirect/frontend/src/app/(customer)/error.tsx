'use client';
 
import { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Analytics } from '@/lib/analytics';

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to our analytics/observability hook
    Analytics.logError(error, { context: 'customer_route_error' });
  }, [error]);

  return (
    <div className="flex flex-col min-h-[60vh] items-center justify-center py-20 px-6 text-center w-full">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-red-50 text-red-500 border border-red-100">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="font-bold text-[20px] mb-2 text-on-surface">
        Something went wrong
      </h2>
      <p className="text-[14px] max-w-[280px] leading-relaxed text-outline mb-8">
        We encountered an unexpected error while loading this page.
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold bg-primary-fixed text-primary transition-transform active:scale-95"
      >
        <RefreshCcw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
