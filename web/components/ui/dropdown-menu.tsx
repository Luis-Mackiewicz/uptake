"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DropdownMenuProps {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({
  label,
  trigger,
  children,
  align = "right",
  open: controlledOpen,
  onOpenChange,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600"
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-30 mt-1 min-w-44 rounded-lg border border-neutral-200 bg-white p-1 shadow-panel",
            align === "right" ? "right-0" : "left-0",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

interface DropdownMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  destructive?: boolean;
}

export function DropdownMenuItem({
  className,
  icon,
  destructive = false,
  children,
  ...props
}: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600",
        destructive
          ? "text-red-600 hover:bg-red-50"
          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
