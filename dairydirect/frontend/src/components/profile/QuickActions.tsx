"use client";

import Link from 'next/link';
import { HeartHandshake, HelpCircle, FileText, Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface QuickActionsProps {
  onLanguageClick: () => void;
  hideHeader?: boolean;
}

export function QuickActions({ onLanguageClick, hideHeader = false }: QuickActionsProps) {
  const { t } = useTranslation();

  const actions = [
    {
      label: t('qualityReports') || 'Quality Reports',
      icon: HeartHandshake,
      href: '/profile/quality-reports',
    },
    {
      label: t('helpCentre') || 'Support & Help',
      icon: HelpCircle,
      href: '/support',
    },
    {
      label: t('termsPolicy') || 'Terms & Policy',
      icon: FileText,
      href: '/terms',
    },
    {
      label: t('languageSettings') || 'Language',
      icon: Globe,
      onClick: onLanguageClick,
    },
  ];

  return (
    <div>
      {!hideHeader && (
        <h2 className="text-sm font-bold text-foreground mb-3">Settings & Support</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          
          const Content = (
            <div className="bg-surface rounded-lg p-3 border border-border flex items-center gap-3 hover:border-border/80 hover:bg-surface-muted/30 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-primary shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-bold text-foreground text-xs">{action.label}</span>
            </div>
          );

          if (action.href) {
            return (
              <Link key={idx} href={action.href} className="block">
                {Content}
              </Link>
            );
          }

          return (
            <div key={idx} onClick={action.onClick}>
              {Content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
