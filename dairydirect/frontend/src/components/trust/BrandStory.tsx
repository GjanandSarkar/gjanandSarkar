"use client";

import { CheckCircle2, ShieldCheck, Factory, Award } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface BrandStoryProps {
  categoryName?: string;
}

export function BrandStory({ categoryName }: BrandStoryProps) {
  const { t, tCategory } = useTranslation();
  const categoryLabel = categoryName ? tCategory(categoryName) : '';

  return (
<<<<<<< HEAD
    <div className="bg-surface rounded-lg p-6 border border-border mt-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {categoryName ? t('partnerCommitmentTitle', { category: categoryLabel }) : t('partnerStandardTitle')}
        </h3>
        <p className="text-sm text-foreground-muted leading-relaxed mb-5">
          {t('partnerCommitmentSub')}
=======
    <div className="bg-white rounded-2xl p-6 border border-border mt-4 shadow-2xs">
      <div>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">The GjanandSarkar Promise</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
          We bring you pure products, directly from verified brands to your doorstep. Every product is rigorously tested to ensure it meets our quality standards.
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="w-8 h-8 rounded-full bg-surface-muted text-primary flex items-center justify-center">
              <Factory className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">{t('directFromFactory')}</h4>
            <p className="text-xs text-foreground-muted leading-normal">{t('directFromFactorySub')}</p>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <div className="w-8 h-8 rounded-full bg-surface-muted text-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">{t('verifiedManufacturer')}</h4>
            <p className="text-xs text-foreground-muted leading-normal">{t('verifiedManufacturerSub')}</p>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <div className="w-8 h-8 rounded-full bg-surface-muted text-primary flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">{t('exclusiveCategoryBrand')}</h4>
            <p className="text-xs text-foreground-muted leading-normal">{t('exclusiveCategoryBrandSub')}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="w-8 h-8 rounded-full bg-surface-muted text-primary flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">{t('fairTransparentPricing')}</h4>
            <p className="text-xs text-foreground-muted leading-normal">{t('fairTransparentPricingSub')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

