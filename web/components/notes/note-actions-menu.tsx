"use client";

import { MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Note } from "@/lib/api/types";

interface NoteActionsMenuProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export function NoteActionsMenu({ note, onEdit, onDelete }: NoteActionsMenuProps) {
  return (
    <DropdownMenu
      label={`Ações de ${note.title}`}
      trigger={<MoreHorizontal size={16} aria-hidden />}
    >
      <DropdownMenuItem
        icon={<PencilLine size={15} aria-hidden />}
        onClick={() => onEdit(note)}
      >
        Abrir no editor
      </DropdownMenuItem>
      <DropdownMenuItem
        destructive
        icon={<Trash2 size={15} aria-hidden />}
        onClick={() => onDelete(note)}
      >
        Excluir
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
