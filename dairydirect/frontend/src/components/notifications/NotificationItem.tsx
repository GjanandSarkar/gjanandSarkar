import React from 'react';
import { Package, Truck, Tag, CreditCard, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'order' | 'delivery' | 'offer' | 'payment' | 'system';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  time: string;
}

interface NotificationItemProps {
  notification: NotificationData;
  onClick?: () => void;
}

const typeConfig = {
  order: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
  delivery: { icon: Truck, color: 'text-green-600', bg: 'bg-green-50' },
  offer: { icon: Tag, color: 'text-primary', bg: 'bg-primary/10' },
  payment: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
  system: { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' },
};

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const config = typeConfig[notification.type] || typeConfig.system;
  const Icon = config.icon;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-start gap-4 p-4 transition-colors cursor-pointer border-b border-sand/50 last:border-0",
        !notification.isRead ? "bg-primary/5" : "hover:bg-sand/30"
      )}
    >
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", config.bg, config.color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h4 className={cn("text-sm font-bold truncate", !notification.isRead ? "text-dark" : "text-dark/80")}>
            {notification.title}
          </h4>
          <span className="text-[10px] font-medium text-muted shrink-0 mt-0.5">{notification.time}</span>
        </div>
        <p className={cn("text-[12px] leading-snug line-clamp-2", !notification.isRead ? "text-on-surface-variant font-medium" : "text-muted")}>
          {notification.message}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 shadow-[0_0_8px_rgba(63,101,48,0.4)]" />
      )}
    </div>
  );
}
