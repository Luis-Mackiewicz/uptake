"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import { ContentActionsMenu } from "./content-actions-menu";
import { useSortableItem } from "@/components/ui/sortable";
import type { Content } from "@/lib/api/types";

interface ContentCardProps {
  content: Content;
  onEdit: (content: Content) => void;
  onDelete: (content: Content) => void;
}

export function ContentCard({ content, onEdit, onDelete }: ContentCardProps) {
  const { attributes, listeners, setNodeRef, style } = useSortableItem(content.id);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      aria-label={`Abrir opções de ${content.title}`}
      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-panel transition hover:border-lime-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600"
      onClick={() => setMenuOpen(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setMenuOpen(true);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          aria-label={`Arrastar ${content.title}`}
          className="flex h-8 w-6 cursor-grab touch-none items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <GripVertical size={16} aria-hidden />
        </button>
        <ContentActionsMenu
          content={content}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
      <h3 className="mt-2 font-display text-xl tracking-wide text-neutral-900">
        {content.title}
      </h3>
      <p className="mt-1 line-clamp-3 text-sm text-neutral-600">
        {content.description ?? "Sem descrição"}
      </p>
    </div>
  );
}
