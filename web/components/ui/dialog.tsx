"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-full items-start justify-center overflow-y-auto bg-neutral-950/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "my-auto max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-panel",
          className,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-2xl tracking-wide text-neutral-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-neutral-600">{description}</p> : null}
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
