"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useResourceList } from "@/hooks/use-resource-list";
import { ApiRequestError, api } from "@/lib/api/client";
import type { Content, CreateNoteRequest, MessageResponse, Note, StudyGroup } from "@/lib/api/types";
import { isBlank, isValidPositiveId, validateLength } from "@/lib/validation";

const MAX_NOTE_BYTES = 2 * 1024 * 1024;

type NoteForm = { title: string; fileName: string; contentId: string; markdownContent: string };
type FormErrors = Partial<Record<keyof NoteForm, string>>;

const emptyForm: NoteForm = { title: "", fileName: "", contentId: "", markdownContent: "" };

export default function NotesPage() {
  const { data, setPage, reload } = useResourceList<Note>("/notes");
  const contentsQuery = useResourceList<Content>("/contents", { limit: 100 });
  const groupsQuery = useResourceList<StudyGroup>("/study-groups", { limit: 100 });
  const { notify } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState<NoteForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Note | null>(null);

  const contents = contentsQuery.data?.data ?? [];
  const groups = groupsQuery.data?.data ?? [];
  const groupName = (id: number) => groups.find((group) => group.id === id)?.name ?? `#${id}`;
  const contentLabel = (content: Content) => `${content.title} · ${groupName(content.studyGroupId)}`;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, contentId: contents[0] ? String(contents[0].id) : "" });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setForm({
      title: note.title,
      fileName: note.fileName,
      contentId: String(note.contentId),
      markdownContent: note.markdownContent,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (isBlank(form.title)) nextErrors.title = "Informe o título";
    else if (!validateLength(form.title, 200)) nextErrors.title = "Máximo de 200 caracteres";
    if (isBlank(form.fileName)) nextErrors.fileName = "Informe o nome do arquivo";
    else if (!validateLength(form.fileName, 255)) nextErrors.fileName = "Máximo de 255 caracteres";
    else if (form.fileName.includes("/") || form.fileName.includes("\\")) nextErrors.fileName = "Não use barras no nome";
    if (!isValidPositiveId(Number(form.contentId))) nextErrors.contentId = "Selecione um conteúdo";
    if (isBlank(form.markdownContent)) nextErrors.markdownContent = "Escreva o conteúdo da nota";
    else if (new TextEncoder().encode(form.markdownContent).length > MAX_NOTE_BYTES) {
      nextErrors.markdownContent = "Nota excede o tamanho máximo de 2 MB";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: CreateNoteRequest = {
      title: form.title.trim(),
      fileName: form.fileName.trim(),
      contentId: Number(form.contentId),
      markdownContent: form.markdownContent,
    };

    setSaving(true);
    try {
      if (editing) await api.patch<Note>(`/notes/${editing.id}`, payload);
      else await api.post<Note>("/notes", payload);
      notify(editing ? "Nota atualizada" : "Nota criada", "success");
      setDialogOpen(false);
      reload();
    } catch (error) {
      if (error instanceof ApiRequestError && error.issues) {
        const apiErrors: FormErrors = {};
        Object.entries(error.issues).forEach(([key, messages]) => {
          if (key in form) apiErrors[key as keyof NoteForm] = messages[0];
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
      await api.delete<MessageResponse>(`/notes/${deleting.id}`);
      notify("Nota removida", "success");
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
        title="Notas"
        description="Registre anotações em Markdown por conteúdo."
        actions={<Button onClick={openCreate} disabled={!contents.length}>Nova nota</Button>}
      />

      <Card className="p-0">
        {data?.data.length ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((note) => {
                  const content = contents.find((item) => item.id === note.contentId);
                  return (
                    <TableRow key={note.id}>
                      <TableCell className="font-medium">{note.title}</TableCell>
                      <TableCell className="font-mono text-xs text-neutral-600">{note.fileName}</TableCell>
                      <TableCell>{content ? contentLabel(content) : `#${note.contentId}`}</TableCell>
                      <TableCell><Badge tone="neutral">{Math.max(1, Math.ceil(note.sizeBytes / 1024))} KB</Badge></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => openEdit(note)}>
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleting(note)}>
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
            title={data ? "Nenhuma nota encontrada" : "Carregando..."}
            description={contents.length ? "Crie uma nota para anexar a um conteúdo." : "Cadastre um conteúdo primeiro."}
            action={<Button onClick={openCreate} disabled={!contents.length}>Nova nota</Button>}
          />
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar nota" : "Nova nota"} className="max-w-3xl">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" htmlFor="note-title" error={errors.title}>
              <Input id="note-title" value={form.title} invalid={Boolean(errors.title)} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </Field>
            <Field label="Arquivo" htmlFor="note-file" error={errors.fileName} hint="Ex.: resumo.md">
              <Input id="note-file" value={form.fileName} invalid={Boolean(errors.fileName)} onChange={(event) => setForm({ ...form, fileName: event.target.value })} />
            </Field>
          </div>
          <Field label="Conteúdo" htmlFor="note-content" error={errors.contentId}>
            <Select id="note-content" value={form.contentId} invalid={Boolean(errors.contentId)} onChange={(event) => setForm({ ...form, contentId: event.target.value })}>
              <option value="">Selecione</option>
              {contents.map((content) => (
                <option key={content.id} value={content.id}>{contentLabel(content)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Markdown" htmlFor="note-markdown" error={errors.markdownContent} hint="Tamanho calculado automaticamente pelo servidor.">
            <Textarea id="note-markdown" className="min-h-64 font-mono text-xs" value={form.markdownContent} invalid={Boolean(errors.markdownContent)} onChange={(event) => setForm({ ...form, markdownContent: event.target.value })} />
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
        title="Excluir nota"
        description={`A nota "${deleting?.title ?? ""}" será ocultada.`}
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
