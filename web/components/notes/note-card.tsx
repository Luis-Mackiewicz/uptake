"use client";

import { FileText, GripVertical } from "lucide-react";
import { NoteActionsMenu } from "./note-actions-menu";
import { Badge } from "@/components/ui/badge";
import { useSortableItem } from "@/components/ui/sortable";
import { cn } from "@/lib/cn";
import type { Note } from "@/lib/api/types";

interface NoteCardProps {
  note: Note;
  isActive: boolean;
  isOpen: boolean;
  isDirty: boolean;
  canDrag: boolean;
  contentLabel: string;
  onOpen: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export function NoteCard({
  note,
  isActive,
  isOpen,
  isDirty,
  canDrag,
  contentLabel,
  onOpen,
  onDelete,
}: NoteCardProps) {
  const { attributes, listeners, setNodeRef, style } = useSortableItem(note.id, {
    disabled: !canDrag,
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-3 shadow-panel transition hover:border-lime-400",
        isActive && "border-lime-400 bg-lime-50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {canDrag ? (
          <button
            type="button"
            aria-label={`Arrastar ${note.title}`}
            className="flex h-8 w-6 cursor-grab touch-none items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} aria-hidden />
          </button>
        ) : (
          <span className="flex h-8 w-6 items-center justify-center text-neutral-300" aria-hidden>
            <FileText size={16} />
          </span>
        )}
        <NoteActionsMenu note={note} onEdit={onOpen} onDelete={onDelete} />
      </div>
      <button
        type="button"
        onClick={() => onOpen(note)}
        className="mt-1 block w-full rounded-md px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600"
      >
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-neutral-900">{note.title}</span>
          {isDirty ? (
            <span className="text-xs text-amber-600" title="Alterações não salvas">●</span>
          ) : null}
        </span>
        <span className="block truncate text-xs text-neutral-500">{contentLabel}</span>
      </button>
      {isActive || isOpen ? (
        <div className="mt-2 flex gap-2 border-t border-neutral-200 pt-2">
          {isActive ? <Badge tone="lime">Ativa</Badge> : <Badge>Aberta</Badge>}
        </div>
      ) : null}
    </div>
  );
}
