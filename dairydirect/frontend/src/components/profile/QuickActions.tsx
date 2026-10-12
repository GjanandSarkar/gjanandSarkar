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
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: t('helpCentre') || 'Support',
      icon: HelpCircle,
      href: '#', // Placeholder
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: t('termsPolicy') || 'Terms & Policy',
      icon: FileText,
      href: '#', // Placeholder
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: t('languageSettings') || 'Language',
      icon: Globe,
      onClick: onLanguageClick,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div>
      {!hideHeader && (
        <h2 className="text-lg font-black text-dark tracking-wide mb-4">Settings & Support</h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          
          const Content = (
            <div className="bg-white rounded-[20px] p-4 border border-sand/50 shadow-sm flex flex-col items-center justify-center text-center h-full hover:border-primary/50 transition-colors active:scale-95 cursor-pointer">
              <div className={`w-10 h-10 rounded-full ${action.bg} ${action.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-dark text-xs">{action.label}</span>
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
