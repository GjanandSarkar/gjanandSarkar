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
    <div className="bg-surface rounded-lg p-6 border border-border mt-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {categoryName ? t('partnerCommitmentTitle', { category: categoryLabel }) : t('partnerStandardTitle')}
        </h3>
        <p className="text-sm text-foreground-muted leading-relaxed mb-5">
          {t('partnerCommitmentSub')}
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

