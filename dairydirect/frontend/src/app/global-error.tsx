'use client';
 
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col min-h-screen items-center justify-center bg-cream px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-red-50 text-red-500 border border-red-100">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="font-bold text-[24px] mb-2 text-on-surface">
            Fatal System Error
          </h1>
          <p className="text-[14px] max-w-[280px] leading-relaxed text-outline mb-8">
            A critical error occurred. Please refresh the page to try again.
          </p>
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-primary text-white shadow-lg shadow-primary/20 transition-transform active:scale-95"
          >
            <RefreshCcw className="w-4 h-4" />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
