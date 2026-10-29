import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active border border-transparent shadow-xs",
        secondary: "bg-secondary text-on-secondary hover:bg-secondary-hover shadow-xs",
        outline: "border border-border text-foreground bg-surface hover:bg-surface-muted hover:border-border-hover",
        ghost: "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
        link: "font-medium text-primary underline-offset-4 hover:underline p-0 h-auto",
        destructive: "bg-error text-on-error hover:bg-error/90 shadow-xs",
      },
      size: {
        default: "min-h-[44px] h-11 px-5 py-2.5 rounded-lg text-sm",
        sm: "min-h-[44px] h-11 px-3.5 py-2 rounded-lg text-xs",
        lg: "min-h-[48px] h-12 px-6 py-3 rounded-lg text-base",
        icon: "min-h-[44px] min-w-[44px] h-11 w-11 rounded-lg p-0",
        full: "min-h-[44px] h-11 w-full px-5 py-2.5 rounded-lg text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
