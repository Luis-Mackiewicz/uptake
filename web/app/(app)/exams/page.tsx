"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ExamCard } from "@/components/exams/exam-card";
import { ExamRow } from "@/components/exams/exam-row";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useResourceList } from "@/hooks/use-resource-list";
import { useViewMode } from "@/hooks/use-view-mode";
import { ApiRequestError, api } from "@/lib/api/client";
import type { Content, CreateExamRequest, Exam, MessageResponse, Note, StudyGroup } from "@/lib/api/types";
import { isBlank, isValidDate, isValidPositiveId, validateLength } from "@/lib/validation";

type ExamForm = {
  title: string;
  description: string;
  examDate: string;
  location: string;
  studyGroupId: string;
  noteIds: string[];
};
type FormErrors = Partial<Record<keyof ExamForm | "noteIds", string>>;

const emptyForm: ExamForm = {
  title: "",
  description: "",
  examDate: "",
  location: "",
  studyGroupId: "",
  noteIds: [],
};

function toDateInput(value: string) {
  return value.slice(0, 10);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function ExamsPage() {
  const { data, setPage, reload } = useResourceList<Exam>("/exams");
  const groupsQuery = useResourceList<StudyGroup>("/study-groups", { limit: 100 });
  const notesQuery = useResourceList<Note>("/notes", { limit: 100 });
  const contentsQuery = useResourceList<Content>("/contents", { limit: 100 });
  const { notify } = useToast();
  const [view, setView] = useViewMode("uptake:exams-view");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState<ExamForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Exam | null>(null);

  const groups = groupsQuery.data?.data ?? [];
  const notes = notesQuery.data?.data ?? [];
  const contents = contentsQuery.data?.data ?? [];
  const groupName = (id: number | null) => {
    if (id === null) return "Sem grupo";
    return groups.find((group) => group.id === id)?.name ?? `#${id}`;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, examDate: new Date().toISOString().slice(0, 10) });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setEditing(exam);
    setForm({
      title: exam.title,
      description: exam.description ?? "",
      examDate: toDateInput(exam.examDate),
      location: exam.location ?? "",
      studyGroupId: exam.studyGroupId ? String(exam.studyGroupId) : "",
      noteIds: (exam.noteIds ?? []).map(String),
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (isBlank(form.title)) nextErrors.title = "Informe o título";
    else if (!validateLength(form.title, 200)) nextErrors.title = "Máximo de 200 caracteres";
    if (!validateLength(form.description, 500)) nextErrors.description = "Máximo de 500 caracteres";
    if (!isValidDate(form.examDate)) nextErrors.examDate = "Informe uma data válida";
    if (!validateLength(form.location, 255)) nextErrors.location = "Máximo de 255 caracteres";
    if (form.studyGroupId && !isValidPositiveId(Number(form.studyGroupId))) nextErrors.studyGroupId = "Grupo inválido";
    if (form.noteIds.length > 50) nextErrors.noteIds = "Máximo de 50 notas";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: CreateExamRequest = {
      title: form.title.trim(),
      description: isBlank(form.description) ? null : form.description.trim(),
      examDate: form.examDate,
      location: isBlank(form.location) ? null : form.location.trim(),
      studyGroupId: form.studyGroupId ? Number(form.studyGroupId) : null,
      noteIds: form.noteIds.map(Number),
    };

    setSaving(true);
    try {
      if (editing) await api.patch<Exam>(`/exams/${editing.id}`, payload);
      else await api.post<Exam>("/exams", payload);
      notify(editing ? "Prova atualizada" : "Prova criada", "success");
      setDialogOpen(false);
      reload();
    } catch (error) {
      if (error instanceof ApiRequestError && error.issues) {
        const apiErrors: FormErrors = {};
        Object.entries(error.issues).forEach(([key, messages]) => {
          if (key in form || key === "noteIds") apiErrors[key as keyof FormErrors] = messages[0];
        });
        setErrors(apiErrors);
      }
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await api.delete<MessageResponse>(`/exams/${deleting.id}`);
      notify("Prova removida", "success");
      setDeleting(null);
      reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível remover", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleNote = (id: string) => {
    setForm((current) => ({
      ...current,
      noteIds: current.noteIds.includes(id)
        ? current.noteIds.filter((item) => item !== id)
        : [...current.noteIds, id],
    }));
  };

  return (
    <div>
      <PageHeader
        title="Provas"
        description="Planeje avaliações e vincule notas de estudo."
        actions={
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <Button onClick={openCreate}>Nova prova</Button>
          </div>
        }
      />

      {data?.data.length ? (
        <>
          {view === "table" ? (
            <Card className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((exam) => (
                    <ExamRow
                      key={exam.id}
                      exam={exam}
                      groupLabel={groupName(exam.studyGroupId)}
                      dateLabel={formatDate(exam.examDate)}
                      onEdit={openEdit}
                      onDelete={setDeleting}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.data.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  groupLabel={groupName(exam.studyGroupId)}
                  dateLabel={formatDate(exam.examDate)}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                />
              ))}
            </div>
          )}
          <div className="mt-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <Card>
          <EmptyState
            title={data ? "Nenhuma prova encontrada" : "Carregando..."}
            description="Cadastre uma prova para acompanhar seus preparativos."
            action={<Button onClick={openCreate}>Nova prova</Button>}
          />
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar prova" : "Nova prova"} className="max-w-3xl">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" htmlFor="exam-title" error={errors.title}>
              <Input id="exam-title" value={form.title} invalid={Boolean(errors.title)} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </Field>
            <Field label="Data" htmlFor="exam-date" error={errors.examDate}>
              <Input id="exam-date" type="date" value={form.examDate} invalid={Boolean(errors.examDate)} onChange={(event) => setForm({ ...form, examDate: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Grupo" htmlFor="exam-group" error={errors.studyGroupId}>
              <Select id="exam-group" value={form.studyGroupId} invalid={Boolean(errors.studyGroupId)} onChange={(event) => setForm({ ...form, studyGroupId: event.target.value })}>
                <option value="">Sem grupo</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Local" htmlFor="exam-location" error={errors.location}>
              <Input id="exam-location" value={form.location} invalid={Boolean(errors.location)} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </Field>
          </div>
          <Field label="Descrição" htmlFor="exam-description" error={errors.description}>
            <Textarea id="exam-description" value={form.description} invalid={Boolean(errors.description)} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
          <Field label="Notas vinculadas" htmlFor="exam-notes" error={errors.noteIds} hint="Selecione uma ou mais notas.">
            <div id="exam-notes" className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-neutral-200 bg-white p-3">
              {notes.length ? notes.map((note) => {
                const content = contents.find((item) => item.id === note.contentId);
                return (
                  <label key={note.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      className="size-4 accent-lime-600"
                      checked={form.noteIds.includes(String(note.id))}
                      onChange={() => toggleNote(String(note.id))}
                    />
                    <span>{note.title}</span>
                    {content ? <span className="text-xs text-neutral-500">· {content.title}</span> : null}
                  </label>
                );
              }) : <p className="text-sm text-neutral-500">Cadastre notas para vincular.</p>}
            </div>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Salvar
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir prova"
        description={`A prova "${deleting?.title ?? ""}" será removida.`}
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
