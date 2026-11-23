"use client";

import { Button } from "@/components/ui/button";
import type { StudyGroup } from "@/lib/api/types";

interface StudyGroupActionsProps {
  group: StudyGroup;
  onEdit: (group: StudyGroup) => void;
  onDelete: (group: StudyGroup) => void;
}

export function StudyGroupActions({ group, onEdit, onDelete }: StudyGroupActionsProps) {
  return (
    <div
      className="flex justify-end gap-2"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Button variant="secondary" size="sm" onClick={() => onEdit(group)}>
        Editar
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(group)}>
        Excluir
      </Button>
    </div>
  );
}
