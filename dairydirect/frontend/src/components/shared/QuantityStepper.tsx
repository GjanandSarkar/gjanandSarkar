import * as React from "react"
import { Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface QuantityStepperProps {
  quantity: number;
  onIncrement: (e: React.MouseEvent) => void;
  onDecrement: (e: React.MouseEvent) => void;
  disabled?: boolean;
  min?: number;
  className?: string;
  size?: "sm" | "md";
}

function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  disabled = false,
  min = 0,
  className,
  size = "md"
}: QuantityStepperProps) {
  const isSm = size === "sm";

  return (
    <div className={cn(
      "flex items-center justify-between rounded-lg overflow-hidden bg-surface border border-border shadow-xs",
      isSm ? "h-11" : "h-11",
      className
    )}>
      <button
        onClick={onDecrement}
        disabled={disabled || quantity <= min}
        className={cn(
          "flex items-center justify-center transition-colors duration-150 hover:bg-surface-muted disabled:opacity-40 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:z-10",
          "w-11 h-11 min-w-[44px] min-h-[44px]"
        )}
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" strokeWidth={2.5} />
      </button>
      <span className={cn(
        "text-center font-semibold text-foreground min-w-[2rem] tabular-nums",
        isSm ? "text-xs px-1" : "text-sm px-2"
      )}>
        {quantity}
      </span>
      <button
        onClick={onIncrement}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center transition-colors duration-150 hover:bg-surface-muted disabled:opacity-40 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:z-10",
          "w-11 h-11 min-w-[44px] min-h-[44px]"
        )}
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}

export { QuantityStepper }
