import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      elevated = false,
      interactive = false,
      padding = "md",
      tabIndex,
      ...props
    },
    ref
  ) => {
    const paddingClasses = {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-5",
    };

    return (
      <div
        ref={ref}
        tabIndex={interactive ? (tabIndex ?? 0) : tabIndex}
        className={cn(
          "bg-surface text-foreground rounded-[var(--radius-card)] border border-border transition-all duration-[var(--dur-state)] ease-[var(--ease-standard)]",
          paddingClasses[padding],
          elevated && "shadow-sm",
          interactive &&
            "cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] active:duration-[var(--dur-press)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ink)] focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export { Card };
