"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useResourceList } from "@/hooks/use-resource-list";
import { ApiRequestError, api } from "@/lib/api/client";
import type { CreateReviewRequest, MessageResponse, Note, Review, UpdateReviewRequest } from "@/lib/api/types";
import { isValidPositiveId } from "@/lib/validation";

const INTERVALS = [1, 3, 7, 15, 30, 60];

type ReviewForm = { noteId: string; nextReviewAt: string; intervalDays: string };
type FormErrors = Partial<Record<keyof ReviewForm, string>>;

const emptyForm: ReviewForm = { noteId: "", nextReviewAt: "", intervalDays: "1" };

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function ReviewsPage() {
  const [dueOnly, setDueOnly] = useState(false);
  const { data, setPage, reload } = useResourceList<Review>("/reviews", { due: dueOnly });
  const notesQuery = useResourceList<Note>("/notes", { limit: 100 });
  const { notify } = useToast();
  const [now, setNow] = useState(() => Date.now());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState<ReviewForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Review | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const notes = notesQuery.data?.data ?? [];
  const noteTitle = (id: number) => notes.find((note) => note.id === id)?.title ?? `#${id}`;
  const isDue = (value: string) => new Date(value).getTime() <= now;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, noteId: notes[0] ? String(notes[0].id) : "" });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (review: Review) => {
    setEditing(review);
    setForm({
      noteId: String(review.noteId),
      nextReviewAt: toDateTimeLocal(review.nextReviewAt),
      intervalDays: String(review.intervalDays),
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!editing && !isValidPositiveId(Number(form.noteId))) nextErrors.noteId = "Selecione uma nota";
    if (form.nextReviewAt && Number.isNaN(new Date(form.nextReviewAt).getTime())) {
      nextErrors.nextReviewAt = "Data inválida";
    }
    if (!INTERVALS.includes(Number(form.intervalDays))) nextErrors.intervalDays = "Intervalo inválido";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const intervalDays = Number(form.intervalDays);
    setSaving(true);
    try {
      if (editing) {
        const payload: UpdateReviewRequest = {
          intervalDays,
          ...(form.nextReviewAt ? { nextReviewAt: new Date(form.nextReviewAt).toISOString() } : {}),
        };
        await api.patch<Review>(`/reviews/${editing.id}`, payload);
      } else {
        const payload: CreateReviewRequest = {
          noteId: Number(form.noteId),
          intervalDays,
          ...(form.nextReviewAt ? { nextReviewAt: new Date(form.nextReviewAt).toISOString() } : {}),
        };
        await api.post<Review>("/reviews", payload);
      }
      notify(editing ? "Revisão atualizada" : "Revisão criada", "success");
      setDialogOpen(false);
      reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (review: Review) => {
    setSaving(true);
    try {
      await api.post<Review>(`/reviews/${review.id}/complete`);
      notify("Revisão concluída", "success");
      reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível concluir", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await api.delete<MessageResponse>(`/reviews/${deleting.id}`);
      notify("Revisão removida", "success");
      setDeleting(null);
      reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível remover", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Revisões"
        description="Mantenha o conteúdo fresco com revisões espaçadas."
        actions={
          <>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-lime-600"
                checked={dueOnly}
                onChange={(event) => {
                  setDueOnly(event.target.checked);
                  setPage(1);
                }}
              />
              Pendentes
            </label>
            <Button onClick={openCreate} disabled={!notes.length}>Nova revisão</Button>
          </>
        }
      />

      <Card className="p-0">
        {data?.data.length ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nota</TableHead>
                  <TableHead>Próxima revisão</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Conclusões</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{noteTitle(review.noteId)}</TableCell>
                    <TableCell>{formatDateTime(review.nextReviewAt)}</TableCell>
                    <TableCell>{review.intervalDays} dia{review.intervalDays === 1 ? "" : "s"}</TableCell>
                    <TableCell>{review.reviewCount}</TableCell>
                    <TableCell>
                      <Badge tone={isDue(review.nextReviewAt) ? "warning" : "success"}>
                        {isDue(review.nextReviewAt) ? "Pendente" : "Agendada"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => handleComplete(review)} disabled={saving}>
                          Concluir
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => openEdit(review)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(review)}>
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4">
              <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState
            title={data ? "Nenhuma revisão encontrada" : "Carregando..."}
            description={notes.length ? "Agende revisões para suas notas." : "Cadastre uma nota primeiro."}
            action={<Button onClick={openCreate} disabled={!notes.length}>Nova revisão</Button>}
          />
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar revisão" : "Nova revisão"}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {!editing ? (
            <Field label="Nota" htmlFor="review-note" error={errors.noteId}>
              <Select id="review-note" value={form.noteId} invalid={Boolean(errors.noteId)} onChange={(event) => setForm({ ...form, noteId: event.target.value })}>
                <option value="">Selecione</option>
                {notes.map((note) => (
                  <option key={note.id} value={note.id}>{note.title}</option>
                ))}
              </Select>
            </Field>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Próxima revisão" htmlFor="review-date" error={errors.nextReviewAt} hint="Vazio usa o padrão da API">
              <Input id="review-date" type="datetime-local" value={form.nextReviewAt} invalid={Boolean(errors.nextReviewAt)} onChange={(event) => setForm({ ...form, nextReviewAt: event.target.value })} />
            </Field>
            <Field label="Intervalo" htmlFor="review-interval" error={errors.intervalDays}>
              <Select id="review-interval" value={form.intervalDays} invalid={Boolean(errors.intervalDays)} onChange={(event) => setForm({ ...form, intervalDays: event.target.value })}>
                {INTERVALS.map((interval) => (
                  <option key={interval} value={interval}>{interval} dia{interval === 1 ? "" : "s"}</option>
                ))}
              </Select>
            </Field>
          </div>
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
        title="Excluir revisão"
        description="A revisão será removida do agendamento."
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
