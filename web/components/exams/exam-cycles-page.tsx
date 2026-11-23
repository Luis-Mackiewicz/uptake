"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, FolderOpen, MapPin, Plus, RefreshCw } from "lucide-react";
import { CycleFormDialog } from "@/components/exams/cycle-form-dialog";
import { ExamKanban } from "@/components/exams/exam-kanban";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useResourceArray } from "@/hooks/use-resource-array";
import { useResourceList } from "@/hooks/use-resource-list";
import { ApiRequestError, api } from "@/lib/api/client";
import type {
  Content,
  CreateStudyCycleRequest,
  CyclePriority,
  Exam,
  MessageResponse,
  ReorderStudyCyclesRequest,
  StudyCycle,
  StudyGroup,
  UpdateStudyCycleRequest,
} from "@/lib/api/types";

interface ExamCyclesPageProps {
  examId: number;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function ExamCyclesPage({ examId }: ExamCyclesPageProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [examError, setExamError] = useState<string | null>(null);
  const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<StudyCycle | null>(null);
  const [cycleSaving, setCycleSaving] = useState(false);
  const [deletingCycle, setDeletingCycle] = useState<StudyCycle | null>(null);

  const groupsQuery = useResourceList<StudyGroup>("/study-groups", { limit: 100 });
  const contentsQuery = useResourceList<Content>("/contents", { limit: 100 });
  const cyclesQuery = useResourceArray<StudyCycle>(`/exams/${examId}/cycles`);

  const groups = groupsQuery.data?.data ?? [];
  const contents = contentsQuery.data?.data ?? [];
  const cycles = cyclesQuery.data ?? [];

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const result = await api.get<Exam>(`/exams/${examId}`);
        if (active) setExam(result);
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof ApiRequestError ? error.message : "Não foi possível carregar a prova";
        setExamError(message);
        notify(message, "error");
        if (error instanceof ApiRequestError && error.status === 404) router.replace("/exams");
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [examId, notify, router]);

  const openCycleCreate = () => {
    setEditingCycle(null);
    setCycleDialogOpen(true);
  };

  const openCycleEdit = (cycle: StudyCycle) => {
    setEditingCycle(cycle);
    setCycleDialogOpen(true);
  };

  const handleCycleSave = async (payload: CreateStudyCycleRequest) => {
    setCycleSaving(true);
    try {
      if (editingCycle) {
        await api.patch<StudyCycle>(`/exams/${examId}/cycles/${editingCycle.id}`, payload);
      } else {
        await api.post<StudyCycle>(`/exams/${examId}/cycles`, payload);
      }
      notify(editingCycle ? "Ciclo atualizado" : "Ciclo criado", "success");
      setCycleDialogOpen(false);
      cyclesQuery.reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível salvar", "error");
    } finally {
      setCycleSaving(false);
    }
  };

  const handleCycleDelete = async () => {
    if (!deletingCycle) return;
    setCycleSaving(true);
    try {
      await api.delete<MessageResponse>(`/exams/${examId}/cycles/${deletingCycle.id}`);
      notify("Ciclo removido", "success");
      setDeletingCycle(null);
      cyclesQuery.reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível remover", "error");
    } finally {
      setCycleSaving(false);
    }
  };

  const handleCycleAdvance = async (cycle: StudyCycle) => {
    setCycleSaving(true);
    try {
      const result = await api.post<{ nextContent: { contentId: number } | null }>(
        `/exams/${examId}/cycles/${cycle.id}/advance`,
      );
      const content = contents.find((item) => item.id === result.nextContent?.contentId);
      notify(content ? `Próximo conteúdo: ${content.title}` : "Sem conteúdos ativos", "info");
      cyclesQuery.reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível avançar", "error");
    } finally {
      setCycleSaving(false);
    }
  };

  const handleCycleReorder = async (priority: CyclePriority, ids: number[]) => {
    const payload: ReorderStudyCyclesRequest = { priority, ids };
    setCycleSaving(true);
    try {
      await api.post(`/exams/${examId}/cycles/reorder`, payload);
      cyclesQuery.reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível reordenar", "error");
    } finally {
      setCycleSaving(false);
    }
  };

  const handleCycleMove = async (cycle: StudyCycle, priority: CyclePriority) => {
    const payload: UpdateStudyCycleRequest = {
      name: cycle.name,
      active: cycle.active,
      studyGroupId: cycle.studyGroupId,
      priority,
      contentIds: cycle.contentIds,
    };
    setCycleSaving(true);
    try {
      await api.patch(`/exams/${examId}/cycles/${cycle.id}`, payload);
      cyclesQuery.reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível mover", "error");
    } finally {
      setCycleSaving(false);
    }
  };

  if (!exam) {
    return (
      <Card className="p-6">
        <p className="text-sm text-neutral-600">
          {examError ?? "Carregando prova..."}
        </p>
        <Link href="/exams" className="mt-4 inline-block">
          <Button variant="secondary">
            <ArrowLeft size={16} aria-hidden />
            Voltar
          </Button>
        </Link>
      </Card>
    );
  }

  const groupLabel =
    groups.find((group) => group.id === exam.studyGroupId)?.name ?? "Sem grupo";

  return (
    <div>
      <PageHeader
        title={`Ciclos de ${exam.title}`}
        description="Organize os conteúdos da prova por prioridade e acompanhe a rodada de cada ciclo."
        breadcrumbs={[
          { label: "Provas", href: "/exams" },
          { label: exam.title },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/exams">
              <Button variant="secondary">
                <ArrowLeft size={16} aria-hidden />
                Voltar
              </Button>
            </Link>
            <Button onClick={openCycleCreate}>
              <Plus size={16} aria-hidden />
              Novo ciclo
            </Button>
          </div>
        }
      />

      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl tracking-wide text-neutral-900">{exam.title}</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {exam.description ?? "Sem descrição"}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={15} className="text-lime-700" aria-hidden />
                {formatDate(exam.examDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <FolderOpen size={15} className="text-lime-700" aria-hidden />
                {groupLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-lime-700" aria-hidden />
                {exam.location ?? "Sem local"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="lime">{exam.contentIds.length} conteúdos</Badge>
            <Badge tone="neutral">{exam.noteIds.length} notas</Badge>
          </div>
        </div>
      </Card>

      {cyclesQuery.error ? (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span role="alert">{cyclesQuery.error}</span>
          <Button variant="secondary" size="sm" onClick={cyclesQuery.reload}>
            <RefreshCw size={14} aria-hidden />
            Tentar novamente
          </Button>
        </Card>
      ) : null}

      {cyclesQuery.loading ? (
        <Card className="p-8 text-center text-sm text-neutral-500">Carregando ciclos...</Card>
      ) : cycles.length ? (
        <ExamKanban
          cycles={cycles}
          groups={groups}
          saving={cycleSaving}
          onEdit={openCycleEdit}
          onDelete={setDeletingCycle}
          onAdvance={handleCycleAdvance}
          onReorder={handleCycleReorder}
          onMove={handleCycleMove}
        />
      ) : (
        <EmptyState
          title="Nenhum ciclo nesta prova"
          description="Crie um ciclo para organizar os conteúdos desta prova."
          action={<Button onClick={openCycleCreate}>Novo ciclo</Button>}
        />
      )}

      <CycleFormDialog
        key={`cycle-${cycleDialogOpen}-${editingCycle?.id ?? "new"}-${groups.length}`}
        open={cycleDialogOpen}
        cycle={editingCycle}
        groups={groups}
        contents={contents}
        saving={cycleSaving}
        onClose={() => setCycleDialogOpen(false)}
        onSave={handleCycleSave}
      />

      <ConfirmDialog
        open={Boolean(deletingCycle)}
        title="Excluir ciclo"
        description={`O ciclo "${deletingCycle?.name ?? ""}" será removido.`}
        confirmLabel="Excluir"
        loading={cycleSaving}
        onConfirm={handleCycleDelete}
        onClose={() => setDeletingCycle(null)}
      />
    </div>
  );
}
