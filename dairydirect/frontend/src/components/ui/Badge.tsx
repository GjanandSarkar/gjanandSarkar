import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-foreground-inverse hover:bg-primary-hover",
        secondary:
          "border-transparent bg-surface-muted text-foreground hover:bg-border",
        destructive:
          "border-transparent bg-error text-foreground-inverse hover:brightness-110",
        outline: "text-foreground",
        success: "border-transparent bg-success text-foreground-inverse",
        successSoft: "border-transparent bg-success-bg text-success",
        warning: "border-transparent bg-warning text-foreground-inverse",
        warningSoft: "border-transparent bg-warning-bg text-warning",
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
