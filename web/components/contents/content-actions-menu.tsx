"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, NotebookPen, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Content } from "@/lib/api/types";

interface ContentActionsMenuProps {
  content: Content;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onEdit: (content: Content) => void;
  onDelete: (content: Content) => void;
}

export function ContentActionsMenu({
  content,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ContentActionsMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu
      label={`Ações de ${content.title}`}
      trigger={<MoreHorizontal size={16} aria-hidden />}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DropdownMenuItem
        icon={<NotebookPen size={15} aria-hidden />}
        onClick={() => router.push(`/notes?contentId=${content.id}`)}
      >
        Abrir notas
      </DropdownMenuItem>
      <DropdownMenuItem
        icon={<Pencil size={15} aria-hidden />}
        onClick={() => onEdit(content)}
      >
        Editar
      </DropdownMenuItem>
      <DropdownMenuItem
        destructive
        icon={<Trash2 size={15} aria-hidden />}
        onClick={() => onDelete(content)}
      >
        Excluir
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
