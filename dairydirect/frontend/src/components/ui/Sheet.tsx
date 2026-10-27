"use client";

import * as React from "react";
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
