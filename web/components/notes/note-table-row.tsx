"use client";

import { FileText, GripVertical } from "lucide-react";
import { NoteActionsMenu } from "./note-actions-menu";
import { Badge } from "@/components/ui/badge";
import { useSortableItem } from "@/components/ui/sortable";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import type { Note } from "@/lib/api/types";

interface NoteTableRowProps {
  note: Note;
  isActive: boolean;
  isOpen: boolean;
  isDirty: boolean;
  canDrag: boolean;
  contentLabel: string;
  onOpen: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export function NoteTableRow({
  note,
  isActive,
  isOpen,
  isDirty,
  canDrag,
  contentLabel,
  onOpen,
  onDelete,
}: NoteTableRowProps) {
  const { attributes, listeners, setNodeRef, style } = useSortableItem(note.id, {
    disabled: !canDrag,
  });

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn("transition", isActive && "bg-lime-50 hover:bg-lime-50")}
    >
      <TableCell className="w-8 px-2">
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
      </TableCell>
      <TableCell className="min-w-0 px-1 py-2">
        <button
          type="button"
          onClick={() => onOpen(note)}
          className="block w-full min-w-0 rounded-md px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600"
        >
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-neutral-900">{note.title}</span>
            {isDirty ? (
              <span className="text-xs text-amber-600" title="Alterações não salvas">●</span>
            ) : null}
            {isActive ? <Badge tone="lime">Ativa</Badge> : isOpen ? <Badge>Aberta</Badge> : null}
          </span>
          <span className="block truncate text-xs text-neutral-500">{contentLabel}</span>
        </button>
      </TableCell>
      <TableCell className="w-10 px-2 text-right">
        <NoteActionsMenu note={note} onEdit={onOpen} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}
