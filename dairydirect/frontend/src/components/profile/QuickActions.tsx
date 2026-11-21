"use client";

import Link from 'next/link';
import { HeartHandshake, HelpCircle, FileText } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface QuickActionsProps {
  hideHeader?: boolean;
}

export function QuickActions({ hideHeader = false }: QuickActionsProps) {
  const { t } = useTranslation();

  const actions = [
    {
      label: t('qualityReports') || 'Quality Reports',
      icon: HeartHandshake,
      href: '/profile/quality-reports',
<<<<<<< HEAD
      color: 'text-info',
      bg: 'bg-info-bg',
    },
    {
      label: t('helpCentre') || 'Help Center',
      icon: HelpCircle,
      href: '/support',
      color: 'text-secondary-ink',
      bg: 'bg-warning-bg',
=======
    },
    {
      label: t('helpCentre') || 'Support & Help',
      icon: HelpCircle,
      href: '/support',
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
    },
    {
      label: t('termsPolicy') || 'Terms & Privacy',
      icon: FileText,
      href: '/terms',
<<<<<<< HEAD
      color: 'text-primary',
      bg: 'bg-primary/10',
=======
    },
    {
      label: t('languageSettings') || 'Language',
      icon: Globe,
      onClick: onLanguageClick,
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
    },
  ];

  return (
    <div>
      {!hideHeader && (
<<<<<<< HEAD
        <h2 className="text-base font-semibold text-foreground tracking-tight mb-3">
          Settings & Support
        </h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
=======
        <h2 className="text-sm font-bold text-foreground mb-3">Settings & Support</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        {actions.map((action, idx) => {
          const Icon = action.icon;
          
          const Content = (
<<<<<<< HEAD
            <div className="bg-surface rounded-xl p-4 border border-border shadow-2xs flex flex-col items-center justify-center text-center h-full hover:border-primary/50 hover:shadow-xs transition-all active:scale-[0.98] cursor-pointer">
              <div className={`w-10 h-10 rounded-lg ${action.bg} ${action.color} flex items-center justify-center mb-2.5 shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-semibold text-foreground text-xs">{action.label}</span>
            </div>
          );

          return (
            <Link key={idx} href={action.href} className="block h-full">
=======
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
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              {Content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
