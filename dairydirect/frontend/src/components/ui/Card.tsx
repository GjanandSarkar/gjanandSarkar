import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
<<<<<<< HEAD
  ({ className, interactive, ...props }, ref) => (
    <div
      ref={ref}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        "rounded-lg bg-surface text-foreground p-4 border border-border shadow-xs",
        interactive && "transition-colors duration-150 hover:border-border-hover cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"
=======
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
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

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
