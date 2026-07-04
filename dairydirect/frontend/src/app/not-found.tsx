import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-surface items-center justify-center py-20 px-6 text-center w-full">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-surface-container-low border border-outline-variant/30">
        <Search className="w-8 h-8 text-outline" />
      </div>
      <h2 className="font-bold text-[24px] mb-2 text-on-surface">
        Page Not Found
      </h2>
      <p className="text-[14px] max-w-[280px] leading-relaxed text-outline mb-8">
        We couldn't find the page you were looking for. It might have been moved or doesn't exist.
      </p>
      <Link
        href="/home"
        className="flex items-center gap-2 px-6 py-3 rounded-[12px] text-sm font-bold bg-primary text-white shadow-lg shadow-primary/20 transition-transform active:scale-95"
      >
        Return to Home <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
