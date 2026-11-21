import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-full)] font-semibold tracking-tight transition-colors select-none",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-foreground-muted border border-border",
        brand: "bg-primary-fixed text-brand-ink border border-transparent",
        success: "bg-success-bg text-success border border-transparent",
        warning: "bg-warning-bg text-warning border border-transparent",
        danger: "bg-error-bg text-error border border-transparent",
        info: "bg-info-bg text-info border border-transparent",
        navy: "bg-navy-100 text-secondary dark:bg-navy-700/50 dark:text-navy-50 border border-transparent",
        // Legacy aliases to preserve existing code
        default: "bg-primary-fixed text-brand-ink border border-transparent",
        secondary: "bg-surface-muted text-foreground-muted border border-border",
        destructive: "bg-error-bg text-error border border-transparent",
        outline: "bg-transparent text-foreground border border-border",
        successSoft: "bg-success-bg text-success border border-transparent",
        warningSoft: "bg-warning-bg text-warning border border-transparent",
      },
      size: {
        sm: "h-4 px-1.5 text-[10px]",
        md: "h-5 px-2 text-[11px]",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 bg-current" aria-hidden="true" />}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
