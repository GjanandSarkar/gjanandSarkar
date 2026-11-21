import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  numeric?: boolean;
  error?: string | boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      numeric = false,
      error,
      leftIcon,
      rightIcon,
      helperText,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : helperText;

    return (
      <div className="w-full space-y-1">
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center justify-center text-foreground-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3.5 py-2 text-body-sm text-foreground placeholder:text-foreground-muted transition-colors duration-[var(--dur-state)] ease-[var(--ease-standard)]",
              "focus-visible:outline-none focus-visible:border-brand-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted",
              hasError && "border-error focus-visible:border-error focus-visible:ring-error/20",
              numeric && "tabular font-variant-numeric: tabular-nums",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={hasError ? "true" : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center justify-center text-foreground-muted pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {errorMessage && (
          <p className={cn("text-[12px] leading-tight", hasError ? "text-error" : "text-foreground-muted")}>
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
