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
      color: 'text-info',
      bg: 'bg-info-bg',
    },
    {
      label: t('helpCentre') || 'Help Center',
      icon: HelpCircle,
      href: '/support',
      color: 'text-secondary',
      bg: 'bg-warning-bg',
    },
    {
      label: t('termsPolicy') || 'Terms & Privacy',
      icon: FileText,
      href: '/terms',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: t('languageSettings') || 'Language',
      icon: Globe,
      onClick: onLanguageClick,
      color: 'text-success',
      bg: 'bg-success-bg',
    },
  ];

  return (
    <div>
      {!hideHeader && (
        <h2 className="text-base font-semibold text-foreground tracking-tight mb-3">
          Settings & Support
        </h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          
          const Content = (
            <div className="bg-surface rounded-xl p-4 border border-border shadow-2xs flex flex-col items-center justify-center text-center h-full hover:border-primary/50 hover:shadow-xs transition-all active:scale-[0.98] cursor-pointer">
              <div className={`w-10 h-10 rounded-lg ${action.bg} ${action.color} flex items-center justify-center mb-2.5 shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-semibold text-foreground text-xs">{action.label}</span>
            </div>
          );

          if (action.href) {
            return (
              <Link key={idx} href={action.href} className="block h-full">
                {Content}
              </Link>
            );
          }

          return (
            <div key={idx} onClick={action.onClick} className="h-full">
              {Content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
