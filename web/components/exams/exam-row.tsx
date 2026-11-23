"use client";

import { ExamActions } from "./exam-actions";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Exam } from "@/lib/api/types";

interface ExamRowProps {
  exam: Exam;
  groupLabel: string;
  dateLabel: string;
  contentLabel: string;
  onOpen: (exam: Exam) => void;
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}

export function ExamRow({ exam, groupLabel, dateLabel, contentLabel, onOpen, onEdit, onDelete }: ExamRowProps) {
  return (
    <TableRow
      role="button"
      tabIndex={0}
      aria-label={`Abrir prova ${exam.title}`}
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600"
      onClick={() => onOpen(exam)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(exam);
        }
      }}
    >
      <TableCell className="font-medium">{exam.title}</TableCell>
      <TableCell>{dateLabel}</TableCell>
      <TableCell>{groupLabel}</TableCell>
      <TableCell className="text-neutral-600">{exam.location ?? "—"}</TableCell>
      <TableCell>
        <Badge tone="lime">{contentLabel}</Badge>
      </TableCell>
      <TableCell>
        <Badge tone="neutral">{exam.noteIds?.length ?? 0}</Badge>
      </TableCell>
      <TableCell>
        <ExamActions exam={exam} onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}
