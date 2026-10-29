import * as React from "react"
import { cn } from "@/lib/utils"

export interface PriceDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  price: number;
  originalPrice?: number;
  currencySymbol?: string;
  size?: "sm" | "md" | "lg";
}

function PriceDisplay({ 
  price, 
  originalPrice, 
  currencySymbol = "₹", 
  size = "md", 
  className, 
  ...props 
}: PriceDisplayProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className={cn("flex items-baseline gap-1.5 flex-wrap", className)} {...props}>
      <span className={cn(
        "font-semibold text-foreground tabular-nums",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-xl"
      )}>
        {currencySymbol}{price.toLocaleString('en-IN')}
      </span>
      {hasDiscount && (
        <>
          <span className={cn(
            "line-through text-foreground-muted tabular-nums",
            size === "sm" && "text-xs",
            size === "md" && "text-xs",
            size === "lg" && "text-sm"
          )}>
            {currencySymbol}{originalPrice.toLocaleString('en-IN')}
          </span>
          {discountPercent > 0 && (
            <span className="text-xs font-medium text-highlight bg-highlight-bg px-1.5 py-0.5 rounded-full tabular-nums">
              {discountPercent}% OFF
            </span>
          )}
        </>
      )}
    </div>
  )
}

export { PriceDisplay }
