import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
  {
    variants: {
      variant: {
        // Primary — Deep Meadow gradient  
        default: "text-white",
        // Secondary — Terracotta
        secondary: "text-white",
        // Outline ghost
        outline: "border font-medium",
        // Ghost — transparent  
        ghost: "font-medium",
        // Link style
        link: "font-semibold underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-[48px] px-6 py-2 rounded-[12px] text-[14px]",
        sm: "h-9 px-4 rounded-[10px] text-[13px]",
        lg: "h-[56px] px-8 rounded-[14px] text-[16px]",
        icon: "h-[44px] w-[44px] rounded-[12px]",
        full: "h-[52px] w-full px-6 rounded-[14px] text-[15px]",
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
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Build inline styles for variants (avoids Tailwind arbitrary value issues)
    const variantStyles: React.CSSProperties = {};
    if (variant === 'default' || !variant) {
      Object.assign(variantStyles, {
        background: 'linear-gradient(135deg, #3f6530, #577f46)',
        boxShadow: '0 4px 14px rgba(63, 101, 48, 0.28)',
      });
    } else if (variant === 'secondary') {
      Object.assign(variantStyles, {
        background: 'linear-gradient(135deg, #8a5025, #a8622e)',
        boxShadow: '0 4px 14px rgba(138, 80, 37, 0.22)',
      });
    } else if (variant === 'outline') {
      Object.assign(variantStyles, {
        border: '1.5px solid rgba(63, 101, 48, 0.30)',
        color: 'var(--color-primary)',
        background: 'transparent',
      });
    } else if (variant === 'ghost') {
      Object.assign(variantStyles, {
        color: 'var(--color-on-surface-variant)',
        background: 'transparent',
      });
    } else if (variant === 'link') {
      Object.assign(variantStyles, {
        color: 'var(--color-primary)',
        background: 'transparent',
      });
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{ ...variantStyles, ...style }}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
