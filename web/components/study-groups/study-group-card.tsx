"use client";

import { FolderOpen } from "lucide-react";
import { StudyGroupActions } from "./study-group-actions";
import type { StudyGroup } from "@/lib/api/types";

interface StudyGroupCardProps {
  group: StudyGroup;
  onOpen: (group: StudyGroup) => void;
  onEdit: (group: StudyGroup) => void;
  onDelete: (group: StudyGroup) => void;
}

export function StudyGroupCard({ group, onOpen, onEdit, onDelete }: StudyGroupCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Abrir conteúdos de ${group.name}`}
      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-panel transition hover:border-lime-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600"
      onClick={() => onOpen(group)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(group);
        }
      }}
    >
      <div className="flex items-center gap-2 text-lime-700">
        <FolderOpen size={18} aria-hidden />
        <h3 className="truncate font-display text-xl tracking-wide text-neutral-900">{group.name}</h3>
      </div>
      <p className="mt-2 line-clamp-3 min-h-12 text-sm text-neutral-600">
        {group.description ?? "Sem descrição"}
      </p>
      <div className="mt-4 border-t border-neutral-200 pt-3">
        <StudyGroupActions group={group} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}
