import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[16px] bg-white text-dark shadow-card p-4 transition-all hover:shadow-active border border-transparent",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

export { Card }
