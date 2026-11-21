import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-semibold gap-2 rounded-[var(--radius-md)] select-none transition-[transform,background-color,box-shadow,border-color] duration-[var(--dur-state)] ease-[var(--ease-standard)] active:scale-[0.97] active:duration-[var(--dur-press)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ink)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        brand: "bg-primary text-on-primary shadow-xs hover:bg-primary-hover active:bg-primary-active border border-transparent",
        navy: "bg-secondary text-on-secondary shadow-xs hover:bg-secondary-hover active:brightness-95 border border-transparent",
        outline: "border border-border bg-surface text-foreground hover:border-border-hover hover:bg-surface-muted active:bg-surface-elevated",
        ghost: "text-foreground-muted hover:bg-surface-muted hover:text-foreground active:bg-surface-elevated border border-transparent",
        danger: "bg-error-bg text-error border border-error/20 hover:bg-error/10 active:bg-error/15",
        success: "bg-success-bg text-success border border-success/20 hover:bg-success/10 active:bg-success/15",
        link: "font-semibold text-brand-ink underline-offset-4 hover:underline p-0 h-auto border-0",
        // Legacy aliases to preserve existing code
        default: "bg-primary text-on-primary shadow-xs hover:bg-primary-hover active:bg-primary-active border border-transparent",
        secondary: "bg-secondary text-on-secondary shadow-xs hover:bg-secondary-hover border border-transparent",
        destructive: "bg-error-bg text-error border border-error/20 hover:bg-error/10",
      },
      size: {
        sm: "h-9 px-3 text-caption",
        md: "h-11 px-4 text-body-sm",
        lg: "h-[52px] px-6 text-body",
        icon: "h-11 w-11 p-0 shrink-0",
        // Legacy aliases
        default: "h-11 px-4 text-body-sm",
        full: "h-11 w-full px-4 text-body-sm",
      },
    },
    defaultVariants: {
      variant: "brand",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          fullWidth && "w-full",
          loading && "cursor-wait"
        )}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading ? "true" : undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
            <span className="sr-only">Loading</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
