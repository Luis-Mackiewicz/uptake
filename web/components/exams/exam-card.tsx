"use client";

import { CalendarDays, FileText, FolderOpen, MapPin } from "lucide-react";
import { ExamActions } from "./exam-actions";
import { Badge } from "@/components/ui/badge";
import type { Exam } from "@/lib/api/types";

interface ExamCardProps {
  exam: Exam;
  groupLabel: string;
  dateLabel: string;
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}

export function ExamCard({ exam, groupLabel, dateLabel, onEdit, onDelete }: ExamCardProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-panel transition hover:border-lime-400">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl tracking-wide text-neutral-900">{exam.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
            <CalendarDays size={14} aria-hidden />
            {dateLabel}
          </p>
        </div>
        <Badge tone="lime">
          <FileText size={13} aria-hidden />
          {exam.noteIds?.length ?? 0}
        </Badge>
      </div>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm text-neutral-600">
        {exam.description ?? "Sem descrição"}
      </p>
      <div className="mt-3 space-y-1 text-sm text-neutral-600">
        <p className="flex items-center gap-2">
          <FolderOpen size={15} className="shrink-0 text-lime-700" aria-hidden />
          <span className="truncate">{groupLabel}</span>
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={15} className="shrink-0 text-lime-700" aria-hidden />
          <span className="truncate">{exam.location ?? "Sem local"}</span>
        </p>
      </div>
      <div className="mt-4 border-t border-neutral-200 pt-3">
        <ExamActions exam={exam} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}
