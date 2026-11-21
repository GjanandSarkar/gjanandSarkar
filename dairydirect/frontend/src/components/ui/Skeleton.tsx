import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-sm)] bg-surface-muted",
        "after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-surface-elevated/70 after:to-transparent after:animate-[shimmer_1.2s_infinite]",
        "motion-reduce:after:hidden",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
