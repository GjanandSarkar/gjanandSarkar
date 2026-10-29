"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export interface PartnerBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function PartnerBadge({ className, size = "sm" }: PartnerBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors bg-primary-fixed text-primary border border-primary/20",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs",
        className
      )}
      title="Verified Indian Manufacturer - Direct from Factory"
    >
      <ShieldCheck className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4", "shrink-0 text-primary")} />
      {size === "sm" ? (
        <span className="truncate font-semibold">{t('verifiedPartner')}</span>
      ) : (
        <span>{t('officialPartner')}</span>
      )}
    </span>
  );
}
