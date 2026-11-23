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
import type { Content, CreatePomodoroRequest, MessageResponse, PomodoroSession } from "@/lib/api/types";
import { isValidPositiveId } from "@/lib/validation";

type PomodoroForm = { contentId: string; focusMinutes: string; breakMinutes: string };
type FormErrors = Partial<Record<keyof PomodoroForm, string>>;

const emptyForm: PomodoroForm = { contentId: "", focusMinutes: "25", breakMinutes: "5" };

function formatClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function PomodoroPage() {
  const { data, setPage, reload } = useResourceList<PomodoroSession>("/pomodoro-sessions");
  const contentsQuery = useResourceList<Content>("/contents", { limit: 100 });
  const { notify } = useToast();
  const [now, setNow] = useState(() => Date.now());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PomodoroForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<PomodoroSession | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const contents = contentsQuery.data?.data ?? [];
  const contentTitle = (id: number | null) => {
    if (id === null) return "Livre";
    return contents.find((content) => content.id === id)?.title ?? `#${id}`;
  };

  const openCreate = () => {
    setForm({ ...emptyForm, contentId: contents[0] ? String(contents[0].id) : "" });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (form.contentId && !isValidPositiveId(Number(form.contentId))) nextErrors.contentId = "Conteúdo inválido";
    const focus = Number(form.focusMinutes);
    const rest = Number(form.breakMinutes);
    if (!Number.isInteger(focus) || focus < 1 || focus > 180) nextErrors.focusMinutes = "Use de 1 a 180 minutos";
    if (!Number.isInteger(rest) || rest < 0 || rest > 60) nextErrors.breakMinutes = "Use de 0 a 60 minutos";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: CreatePomodoroRequest = {
      contentId: form.contentId ? Number(form.contentId) : null,
      focusMinutes: Number(form.focusMinutes),
      breakMinutes: Number(form.breakMinutes),
    };

    setSaving(true);
    try {
      await api.post<PomodoroSession>("/pomodoro-sessions", payload);
      notify("Sessão iniciada", "success");
      setDialogOpen(false);
      reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível iniciar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async (session: PomodoroSession) => {
    setSaving(true);
    try {
      await api.post<PomodoroSession>(`/pomodoro-sessions/${session.id}/finish`);
      notify("Sessão finalizada", "success");
      reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível finalizar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await api.delete<MessageResponse>(`/pomodoro-sessions/${deleting.id}`);
      notify("Sessão removida", "success");
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
        title="Pomodoro"
        description="Registre sessões de foco e acompanhe o tempo."
        actions={<Button onClick={openCreate}>Iniciar sessão</Button>}
      />

      <Card className="p-0">
        {data?.data.length ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Foco</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((session) => {
                  const elapsed = Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000));
                  const remaining = Math.max(0, session.focusMinutes * 60 - elapsed);
                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{contentTitle(session.contentId)}</TableCell>
                      <TableCell className="text-sm text-neutral-600">{formatDateTime(session.startedAt)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {session.completed ? `${session.focusMinutes} min` : formatClock(remaining)}
                      </TableCell>
                      <TableCell>
                        <Badge tone={session.completed ? "success" : "warning"}>
                          {session.completed ? "Concluída" : "Em andamento"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {!session.completed ? (
                            <Button size="sm" onClick={() => handleFinish(session)} disabled={saving}>
                              Finalizar
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="sm" onClick={() => setDeleting(session)}>
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="p-4">
              <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
            </div>
          </>
        ) : (
          <EmptyState
            title={data ? "Nenhuma sessão registrada" : "Carregando..."}
            description="Inicie uma sessão para medir seu tempo de foco."
            action={<Button onClick={openCreate}>Iniciar sessão</Button>}
          />
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Nova sessão de pomodoro">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="Conteúdo" htmlFor="pomodoro-content" error={errors.contentId} hint="Opcional">
            <Select id="pomodoro-content" value={form.contentId} invalid={Boolean(errors.contentId)} onChange={(event) => setForm({ ...form, contentId: event.target.value })}>
              <option value="">Sessão livre</option>
              {contents.map((content) => (
                <option key={content.id} value={content.id}>{content.title}</option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Foco (min)" htmlFor="focus-minutes" error={errors.focusMinutes}>
              <Input id="focus-minutes" type="number" min={1} max={180} value={form.focusMinutes} invalid={Boolean(errors.focusMinutes)} onChange={(event) => setForm({ ...form, focusMinutes: event.target.value })} />
            </Field>
            <Field label="Pausa (min)" htmlFor="break-minutes" error={errors.breakMinutes}>
              <Input id="break-minutes" type="number" min={0} max={60} value={form.breakMinutes} invalid={Boolean(errors.breakMinutes)} onChange={(event) => setForm({ ...form, breakMinutes: event.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Iniciar
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir sessão"
        description="A sessão será removida do histórico."
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
