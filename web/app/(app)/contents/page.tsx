"use client";

import { useState } from "react";
import type { FormEvent } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useResourceList } from "@/hooks/use-resource-list";
import { ApiRequestError, api } from "@/lib/api/client";
import type { Content, CreateContentRequest, MessageResponse, StudyGroup } from "@/lib/api/types";
import { isBlank, isValidPositiveId, validateLength } from "@/lib/validation";

type ContentForm = { title: string; description: string; studyGroupId: string };
type FormErrors = Partial<Record<keyof ContentForm, string>>;

const emptyForm: ContentForm = { title: "", description: "", studyGroupId: "" };

export default function ContentsPage() {
  const { data, setPage, reload } = useResourceList<Content>("/contents");
  const groupsQuery = useResourceList<StudyGroup>("/study-groups", { limit: 100 });
  const { notify } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Content | null>(null);
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Content | null>(null);

  const groups = groupsQuery.data?.data ?? [];
  const groupName = (id: number) => groups.find((group) => group.id === id)?.name ?? `#${id}`;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, studyGroupId: groups[0] ? String(groups[0].id) : "" });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (content: Content) => {
    setEditing(content);
    setForm({
      title: content.title,
      description: content.description ?? "",
      studyGroupId: String(content.studyGroupId),
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (isBlank(form.title)) nextErrors.title = "Informe o título";
    else if (!validateLength(form.title, 200)) nextErrors.title = "Máximo de 200 caracteres";
    if (!validateLength(form.description, 2000)) nextErrors.description = "Máximo de 2000 caracteres";
    const groupId = Number(form.studyGroupId);
    if (!isValidPositiveId(groupId)) nextErrors.studyGroupId = "Selecione um grupo";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: CreateContentRequest = {
      title: form.title.trim(),
      description: isBlank(form.description) ? null : form.description.trim(),
      studyGroupId: Number(form.studyGroupId),
    };

    setSaving(true);
    try {
      if (editing) await api.patch<Content>(`/contents/${editing.id}`, payload);
      else await api.post<Content>("/contents", payload);
      notify(editing ? "Conteúdo atualizado" : "Conteúdo criado", "success");
      setDialogOpen(false);
      reload();
    } catch (error) {
      if (error instanceof ApiRequestError && error.issues) {
        const apiErrors: FormErrors = {};
        Object.entries(error.issues).forEach(([key, messages]) => {
          if (key in form) apiErrors[key as keyof ContentForm] = messages[0];
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
      await api.delete<MessageResponse>(`/contents/${deleting.id}`);
      notify("Conteúdo removido", "success");
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
        title="Conteúdos"
        description="Cadastre os temas estudados dentro de cada grupo."
        actions={<Button onClick={openCreate} disabled={!groups.length}>Novo conteúdo</Button>}
      />

      <Card className="p-0">
        {data?.data.length ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell className="font-medium">{content.title}</TableCell>
                    <TableCell>{groupName(content.studyGroupId)}</TableCell>
                    <TableCell className="max-w-xs truncate text-neutral-600">{content.description ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(content)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(content)}>
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
            title={data ? "Nenhum conteúdo encontrado" : "Carregando..."}
            description={groups.length ? "Cadastre um conteúdo para anexar notas." : "Crie um grupo de estudo primeiro."}
            action={<Button onClick={openCreate} disabled={!groups.length}>Novo conteúdo</Button>}
          />
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar conteúdo" : "Novo conteúdo"}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="Título" htmlFor="content-title" error={errors.title}>
            <Input id="content-title" value={form.title} invalid={Boolean(errors.title)} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="Grupo" htmlFor="content-group" error={errors.studyGroupId}>
            <Select id="content-group" value={form.studyGroupId} invalid={Boolean(errors.studyGroupId)} onChange={(event) => setForm({ ...form, studyGroupId: event.target.value })}>
              <option value="">Selecione</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Descrição" htmlFor="content-description" error={errors.description}>
            <Textarea id="content-description" value={form.description} invalid={Boolean(errors.description)} onChange={(event) => setForm({ ...form, description: event.target.value })} />
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
        title="Excluir conteúdo"
        description={`Isso também ocultará as notas de "${deleting?.title ?? ""}".`}
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
