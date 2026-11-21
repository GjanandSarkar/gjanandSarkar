"use client";

import * as React from "react";
<<<<<<< HEAD
import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  side?: "bottom" | "right";
  className?: string;
}

export function Sheet({
  isOpen,
  onClose,
  title,
  children,
  side = "bottom",
  className,
}: SheetProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.setAttribute("data-sheet-open", "true");
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
      document.body.removeAttribute("data-sheet-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.body.removeAttribute("data-sheet-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isBottom = side === "bottom";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-[70] flex",
        isBottom ? "flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4" : "justify-end"
      )}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content: 12px radius */}
      <div
        className={cn(
          "relative z-10 bg-surface border-border flex flex-col shadow-modal transition-all duration-200 ease-out",
          isBottom
            ? "w-full sm:max-w-lg max-h-[82dvh] rounded-t-xl sm:rounded-xl border-t sm:border sm:shadow-2xl overflow-hidden mt-auto sm:my-auto sm:mx-auto animate-in fade-in sm:zoom-in-95 slide-in-from-bottom-4 duration-200 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
            : "h-full w-full max-w-md rounded-l-xl border-l ml-auto overflow-y-auto animate-in slide-in-from-right duration-200",
          className
        )}
      >
        {isBottom && (
          <div className="w-10 h-1 bg-border rounded-full mx-auto mt-2.5 -mb-1 sm:hidden shrink-0" />
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          {title ? (
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            type="button"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors -mr-2 cursor-pointer"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
=======
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;

const SheetTrigger = DialogPrimitive.Trigger;

const SheetClose = DialogPrimitive.Close;

const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "bottom" | "left" | "right";
  showClose?: boolean;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, children, side = "bottom", showClose = true, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      role="dialog"
      aria-modal="true"
      className={cn(
        side === "left" &&
          "fixed inset-y-0 left-0 z-50 h-full w-[280px] max-w-[85vw] border-r border-border bg-surface p-6 shadow-2xl text-foreground transition ease-[var(--ease-spring)] duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
        side === "right" &&
          "fixed inset-y-0 right-0 z-50 h-full w-[280px] max-w-[85vw] border-l border-border bg-surface p-6 shadow-2xl text-foreground transition ease-[var(--ease-spring)] duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        side === "bottom" && [
          // Mobile layout: Bottom sheet
          "fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-[var(--radius-2xl)] border-t border-border bg-surface p-6 shadow-2xl text-foreground",
          "pb-[max(16px,env(safe-area-inset-bottom,16px))]",
          "transition ease-[var(--ease-spring)] duration-300",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          // Desktop layout (md+): Centered dialog
          "md:bottom-auto md:left-[50%] md:top-[50%] md:max-w-lg md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-2xl md:border md:border-border",
          "md:data-[state=closed]:slide-out-to-bottom-0 md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95 md:data-[state=open]:slide-in-from-bottom-0",
        ],
        className
      )}
      {...props}
    >
      {/* Mobile drag handle for bottom sheets */}
      {side === "bottom" && (
        <div className="md:hidden w-8 h-1 rounded-full bg-border mx-auto mb-4 shrink-0" aria-hidden="true" />
      )}
      {children}
      {showClose && (
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-foreground-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ink)] transition-colors"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left mb-4",
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-border",
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-bold text-foreground font-[family-name:var(--font-display)]",
      className
    )}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs text-foreground-muted leading-relaxed", className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
