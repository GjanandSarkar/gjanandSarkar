import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-on-primary",
        secondary:
          "border-border bg-surface-muted text-foreground",
        destructive:
          "border-transparent bg-error-bg text-error",
        outline: "border-border text-foreground bg-transparent",
        success: "border-transparent bg-success-bg text-success",
        successSoft: "border-transparent bg-success-bg text-success",
        warning: "border-transparent bg-warning-bg text-warning",
        warningSoft: "border-transparent bg-warning-bg text-warning",
        highlight: "border-transparent bg-highlight-bg text-highlight",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
