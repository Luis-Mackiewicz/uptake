"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  hint?: string;
  trailing?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  value: string | null;
  onChange: (id: string) => void;
  onClose?: (id: string) => void;
  actions?: ReactNode;
  className?: string;
  idPrefix?: string;
}

export function Tabs({ items, value, onChange, onClose, actions, className, idPrefix = "note" }: TabsProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;

    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="tab"]'));
    if (!buttons.length) return;

    const currentIndex = buttons.findIndex((button) => button === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % buttons.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = buttons.length - 1;

    event.preventDefault();
    buttons[nextIndex].focus();
    onChange(buttons[nextIndex].dataset.tabId ?? "");
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn("flex items-end gap-2 border-b border-neutral-200 bg-neutral-50 px-2 pt-2", className)}
      onKeyDown={handleKeyDown}
    >
      <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto">
        {items.map((item) => {
          const selected = item.id === value;
          return (
            <div
              key={item.id}
              className={cn(
                "flex shrink-0 items-center rounded-t-md border border-b-0",
                selected ? "border-neutral-300 bg-white" : "border-transparent hover:bg-neutral-100",
              )}
            >
              <button
                type="button"
                role="tab"
                id={`${idPrefix}-tab-${item.id}`}
                data-tab-id={item.id}
                aria-selected={selected}
                aria-controls={`${idPrefix}-panel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => onChange(item.id)}
                className={cn(
                  "flex max-w-56 items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600",
                  selected && "font-medium text-neutral-950",
                )}
              >
                <span className="truncate">{item.label}</span>
                {item.hint ? <span className="truncate text-xs text-neutral-400">{item.hint}</span> : null}
                {item.trailing}
              </button>
              {onClose ? (
                <button
                  type="button"
                  aria-label={`Fechar ${item.label}`}
                  onClick={() => onClose(item.id)}
                  className="mr-1 flex h-6 w-6 items-center justify-center rounded text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600"
                >
                  ×
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {actions ? <div className="mb-1 flex shrink-0 items-center gap-1 pl-1">{actions}</div> : null}
    </div>
  );
}
