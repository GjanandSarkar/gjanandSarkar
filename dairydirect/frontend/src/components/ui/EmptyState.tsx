import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  illustration?: React.ReactNode | string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

function EmptyState({
  className,
  icon,
  illustration,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  const displayGraphic = illustration || icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center max-w-sm mx-auto py-10 px-4 select-none",
        className
      )}
      {...props}
    >
      {displayGraphic && (
        <div className="w-14 h-14 rounded-full bg-surface-muted border border-border flex items-center justify-center mb-4 text-2xl text-foreground-muted shrink-0 shadow-xs">
          {displayGraphic}
        </div>
      )}
      <h3 className="text-body-lg font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-body-sm text-foreground-muted mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export { EmptyState };
