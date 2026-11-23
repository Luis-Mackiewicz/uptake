"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, FileText } from "lucide-react";
import { ExamList } from "@/components/exams/exam-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useResourceList } from "@/hooks/use-resource-list";
import { useViewMode } from "@/hooks/use-view-mode";
import { api } from "@/lib/api/client";
import { friendlyApiMessage } from "@/lib/api/errors";
import type { Exam, MessageResponse, StudyGroup } from "@/lib/api/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function ExamsView() {
  const router = useRouter();
  const examsQuery = useResourceList<Exam>("/exams", { limit: 100 });
  const groupsQuery = useResourceList<StudyGroup>("/study-groups", { limit: 100 });
  const { notify } = useToast();
  const [view, setView] = useViewMode("uptake:exams-view");
  const [examSaving, setExamSaving] = useState(false);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);

  const exams = examsQuery.data?.data ?? [];
  const groups = groupsQuery.data?.data ?? [];
  const orderedExams = [...exams].sort(
    (first, second) => new Date(first.examDate).getTime() - new Date(second.examDate).getTime(),
  );
  const nextExam = orderedExams[0] ?? null;
  const summaryCards = [
    {
      label: "Próxima prova",
      value: nextExam ? formatDate(nextExam.examDate) : "—",
      hint: nextExam?.title ?? "Nenhuma prova cadastrada",
      icon: CalendarDays,
    },
    {
      label: "Provas cadastradas",
      value: String(examsQuery.data?.total ?? exams.length),
      hint: "Acompanhe suas avaliações",
      icon: FileText,
    },
  ];

  const openExamCreate = () => {
    router.push("/exams/new");
  };

  const openExamEdit = (exam: Exam) => {
    router.push(`/exams/${exam.id}/edit`);
  };

  const openCycles = (exam: Exam) => {
    router.push(`/exams/${exam.id}`);
  };

  const handleExamDelete = async () => {
    if (!deletingExam) return;
    setExamSaving(true);
    try {
      await api.delete<MessageResponse>(`/exams/${deletingExam.id}`);
      notify("Prova removida", "success");
      setDeletingExam(null);
      examsQuery.reload();
    } catch (error) {
      notify(friendlyApiMessage(error, "Não foi possível remover"), "error");
    } finally {
      setExamSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Provas"
        description="Cadastre provas e clique em uma delas para organizar seus ciclos de estudo."
        actions={<Button onClick={openExamCreate}>Nova prova</Button>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    {card.label}
                  </p>
                  <p className="mt-2 font-display text-2xl tracking-wide text-neutral-900">
                    {card.value}
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-100 text-lime-700">
                  <Icon size={18} aria-hidden />
                </span>
              </div>
              <p className="mt-2 truncate text-xs text-neutral-500">{card.hint}</p>
            </Card>
          );
        })}
      </div>

      <ExamList
        data={examsQuery.data}
        view={view}
        groups={groups}
        onViewChange={setView}
        onPageChange={examsQuery.setPage}
        onCreate={openExamCreate}
        onOpen={openCycles}
        onEdit={openExamEdit}
        onDelete={setDeletingExam}
      />

      <ConfirmDialog
        open={Boolean(deletingExam)}
        title="Excluir prova"
        description={`A prova "${deletingExam?.title ?? ""}" será removida.`}
        confirmLabel="Excluir"
        loading={examSaving}
        onConfirm={handleExamDelete}
        onClose={() => setDeletingExam(null)}
      />
    </div>
  );
}
