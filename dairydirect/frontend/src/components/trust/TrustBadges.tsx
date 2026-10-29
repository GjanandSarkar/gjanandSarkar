"use client";

import { ShieldCheck, Factory, Award } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface TrustBadgesProps {
  className?: string;
}

export function TrustBadges({ className = "" }: TrustBadgesProps) {
  const { t } = useTranslation();

  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-surface border border-border text-center">
        <Factory className="w-5 h-5 text-primary mb-1.5" />
        <p className="text-xs font-medium text-foreground leading-tight">{t('verifiedIndianManufacturer')}</p>
      </div>
      <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-surface border border-border text-center">
        <ShieldCheck className="w-5 h-5 text-primary mb-1.5" />
        <p className="text-xs font-medium text-foreground leading-tight">{t('qualityTested')}</p>
      </div>
      <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-surface border border-border text-center">
        <Award className="w-5 h-5 text-primary mb-1.5" />
        <p className="text-xs font-medium text-foreground leading-tight">{t('authenticDirectPricing')}</p>
      </div>
    </div>
  );
}

