"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/cn";

export type ViewMode = "table" | "cards";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      className="inline-flex rounded-md border border-neutral-300 bg-white p-0.5"
      role="group"
      aria-label="Formato de exibição"
    >
      <button
        type="button"
        aria-label="Exibir em tabela"
        aria-pressed={value === "table"}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition",
          value === "table"
            ? "bg-lime-100 text-lime-950"
            : "text-neutral-600 hover:bg-neutral-100",
        )}
        onClick={() => onChange("table")}
      >
        <List size={15} aria-hidden />
        Tabela
      </button>
      <button
        type="button"
        aria-label="Exibir em cards"
        aria-pressed={value === "cards"}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition",
          value === "cards"
            ? "bg-lime-100 text-lime-950"
            : "text-neutral-600 hover:bg-neutral-100",
        )}
        onClick={() => onChange("cards")}
      >
        <LayoutGrid size={15} aria-hidden />
        Cards
      </button>
    </div>
  );
}
