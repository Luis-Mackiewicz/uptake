"use client";

import { ExamActions } from "./exam-actions";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Exam } from "@/lib/api/types";

interface ExamRowProps {
  exam: Exam;
  groupLabel: string;
  dateLabel: string;
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}

export function ExamRow({ exam, groupLabel, dateLabel, onEdit, onDelete }: ExamRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{exam.title}</TableCell>
      <TableCell>{dateLabel}</TableCell>
      <TableCell>{groupLabel}</TableCell>
      <TableCell className="text-neutral-600">{exam.location ?? "—"}</TableCell>
      <TableCell>
        <Badge tone="lime">{exam.noteIds?.length ?? 0}</Badge>
      </TableCell>
      <TableCell>
        <ExamActions exam={exam} onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}
