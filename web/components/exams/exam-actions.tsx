"use client";

import { Button } from "@/components/ui/button";
import type { Exam } from "@/lib/api/types";

interface ExamActionsProps {
  exam: Exam;
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}

export function ExamActions({ exam, onEdit, onDelete }: ExamActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" size="sm" onClick={() => onEdit(exam)}>
        Editar
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(exam)}>
        Excluir
      </Button>
    </div>
  );
}
