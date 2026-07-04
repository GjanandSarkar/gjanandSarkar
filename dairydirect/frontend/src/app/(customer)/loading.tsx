import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col min-h-[60vh] items-center justify-center bg-cream w-full">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="mt-4 text-sm font-medium text-outline">Loading...</p>
    </div>
  );
}
