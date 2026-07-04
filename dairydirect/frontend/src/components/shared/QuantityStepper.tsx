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
      "flex items-center justify-between rounded-xl overflow-hidden bg-surface-muted shadow-sm",
      isSm ? "h-11" : "h-12",
      className
    )}>
      <button
        onClick={onDecrement}
        disabled={disabled || quantity <= min}
        className={cn(
          "flex items-center justify-center transition-all hover:bg-surface-elevated active:scale-95 disabled:opacity-50 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:z-10",
          isSm ? "w-11 h-11" : "w-12 h-12"
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={isSm ? "w-4 h-4" : "w-5 h-5"} strokeWidth={3} />
      </button>
      <span className={cn(
        "text-center font-bold text-foreground min-w-[2rem]",
        isSm ? "text-body-sm px-1" : "text-body-md px-2"
      )}>
        {quantity}
      </span>
      <button
        onClick={onIncrement}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center transition-all hover:bg-surface-elevated active:scale-95 disabled:opacity-50 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:z-10",
          isSm ? "w-11 h-11" : "w-12 h-12"
        )}
        aria-label="Increase quantity"
      >
        <Plus className={isSm ? "w-4 h-4" : "w-5 h-5"} strokeWidth={3} />
      </button>
    </div>
  )
}

export { QuantityStepper }
