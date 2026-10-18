import { CheckCircle2, ShieldCheck, ThermometerSnowflake, Leaf } from 'lucide-react';

export function BrandStory() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-border mt-4 shadow-2xs">
      <div>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">The GjanandSarkar Promise</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
          We bring you pure products, directly from verified brands to your doorstep. Every product is rigorously tested to ensure it meets our quality standards.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ThermometerSnowflake className="w-4 h-4" />
            </div>
            <h4 className="text-[12px] font-bold text-dark">Cold-Chain Delivery</h4>
            <p className="text-[11px] text-muted leading-tight">Maintained at 4°C to lock in freshness.</p>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-[12px] font-bold text-dark">Lab Tested</h4>
            <p className="text-[11px] text-muted leading-tight">Passed 24+ quality parameters.</p>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="text-[12px] font-bold text-dark">No Preservatives</h4>
            <p className="text-[11px] text-muted leading-tight">100% natural, just as nature intended.</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
            <h4 className="text-[12px] font-bold text-dark">Ethically Sourced</h4>
            <p className="text-[11px] text-muted leading-tight">Verified brands, made in India.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
