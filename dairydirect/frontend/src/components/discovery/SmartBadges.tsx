import { Flame, Star, Repeat, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeType = 'bestseller' | 'popular' | 'reordered' | 'trending';

interface SmartBadgeProps {
  type: BadgeType;
  className?: string;
}

export function SmartBadge({ type, className }: SmartBadgeProps) {
  const configs: Record<BadgeType, { icon: any, label: string, styles: string }> = {
    bestseller: {
      icon: Star,
      label: 'Best Seller',
      styles: 'bg-warning-bg text-warning border-warning/20'
    },
    popular: {
      icon: Flame,
      label: 'Popular',
      styles: 'bg-error-bg text-error border-error/20'
    },
    reordered: {
      icon: Repeat,
      label: 'Frequently Reordered',
      styles: 'bg-mint text-primary border-primary/20'
    },
    trending: {
      icon: TrendingUp,
      label: 'Trending',
      styles: 'bg-info-bg text-info border-info-bg'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-widest shadow-sm",
      config.styles,
      className
    )}>
      <Icon className="w-3 h-3" strokeWidth={3} />
      {config.label}
    </div>
  );
}
