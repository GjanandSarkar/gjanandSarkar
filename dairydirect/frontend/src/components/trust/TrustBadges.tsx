import { ShieldCheck, Droplets, HeartPulse } from 'lucide-react';

interface TrustBadgesProps {
  className?: string;
}

export function TrustBadges({ className = "" }: TrustBadgesProps) {
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      <div className="flex flex-col items-center justify-center p-3 rounded-[16px] bg-white border border-sand text-center">
        <Droplets className="w-5 h-5 text-primary mb-1" />
        <p className="text-[10px] font-bold text-dark leading-tight">Fresh Every<br/>Morning</p>
      </div>
      <div className="flex flex-col items-center justify-center p-3 rounded-[16px] bg-white border border-sand text-center">
        <ShieldCheck className="w-5 h-5 text-primary mb-1" />
        <p className="text-[10px] font-bold text-dark leading-tight">Quality<br/>Checked</p>
      </div>
      <div className="flex flex-col items-center justify-center p-3 rounded-[16px] bg-white border border-sand text-center">
        <HeartPulse className="w-5 h-5 text-primary mb-1" />
        <p className="text-[10px] font-bold text-dark leading-tight">No Added<br/>Preservatives</p>
      </div>
    </div>
  );
}
