"use client";

import { StudyGroupActions } from "./study-group-actions";
import { TableCell, TableRow } from "@/components/ui/table";
import type { StudyGroup } from "@/lib/api/types";

interface StudyGroupRowProps {
  group: StudyGroup;
  onOpen: (group: StudyGroup) => void;
  onEdit: (group: StudyGroup) => void;
  onDelete: (group: StudyGroup) => void;
}

export function StudyGroupRow({ group, onOpen, onEdit, onDelete }: StudyGroupRowProps) {
  return (
    <TableRow
      role="link"
      tabIndex={0}
      className="cursor-pointer transition hover:bg-neutral-50"
      onClick={() => onOpen(group)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
          event.preventDefault();
          onOpen(group);
        }
      }}
    >
      <TableCell className="font-medium">{group.name}</TableCell>
      <TableCell className="max-w-xs truncate text-neutral-600">{group.description ?? "—"}</TableCell>
      <TableCell>
        <StudyGroupActions group={group} onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}
