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
  return (
    <div className={cn("flex items-baseline gap-1.5", className)} {...props}>
      <span className={cn(
        "font-bold text-primary",
        size === "sm" && "text-body-sm",
        size === "md" && "text-body-lg",
        size === "lg" && "text-h3"
      )}>
        {currencySymbol}{price}
      </span>
      {originalPrice && originalPrice > price && (
        <span className={cn(
          "line-through text-foreground-muted",
          size === "sm" && "text-caption",
          size === "md" && "text-body-sm",
          size === "lg" && "text-body-md"
        )}>
          {currencySymbol}{originalPrice}
        </span>
      )}
    </div>
  )
}

export { PriceDisplay }
