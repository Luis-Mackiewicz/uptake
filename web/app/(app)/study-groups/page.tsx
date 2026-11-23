"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { useResourceList } from "@/hooks/use-resource-list";
import { ApiRequestError, api } from "@/lib/api/client";
import type { CreateStudyGroupRequest, MessageResponse, StudyGroup } from "@/lib/api/types";
import { isBlank, isValidHexColor, validateLength } from "@/lib/validation";

type GroupForm = { name: string; description: string; color: string };
type FormErrors = Partial<Record<keyof GroupForm, string>>;

const emptyForm: GroupForm = { name: "", description: "", color: "#84cc16" };

export default function StudyGroupsPage() {
  const { data, setPage, reload } = useResourceList<StudyGroup>("/study-groups");
  const { notify } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StudyGroup | null>(null);
  const [form, setForm] = useState<GroupForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<StudyGroup | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (group: StudyGroup) => {
    setEditing(group);
    setForm({
      name: group.name,
      description: group.description ?? "",
      color: group.color ?? "#84cc16",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (isBlank(form.name)) nextErrors.name = "Informe o nome";
    else if (!validateLength(form.name, 100)) nextErrors.name = "Máximo de 100 caracteres";
    if (!validateLength(form.description, 500)) nextErrors.description = "Máximo de 500 caracteres";
    if (!isValidHexColor(form.color)) nextErrors.color = "Use uma cor hexadecimal";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: CreateStudyGroupRequest = {
      name: form.name.trim(),
      description: isBlank(form.description) ? null : form.description.trim(),
      color: form.color.trim(),
    };

    setSaving(true);
    try {
      if (editing) await api.patch<StudyGroup>(`/study-groups/${editing.id}`, payload);
      else await api.post<StudyGroup>("/study-groups", payload);
      notify(editing ? "Grupo atualizado" : "Grupo criado", "success");
      setDialogOpen(false);
      reload();
    } catch (error) {
      if (error instanceof ApiRequestError && error.issues) {
        const apiErrors: FormErrors = {};
        Object.entries(error.issues).forEach(([key, messages]) => {
          if (key in form) apiErrors[key as keyof GroupForm] = messages[0];
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
      await api.delete<MessageResponse>(`/study-groups/${deleting.id}`);
      notify("Grupo removido", "success");
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
        title="Grupos de estudo"
        description="Organize seus conteúdos por assunto."
        actions={<Button onClick={openCreate}>Novo grupo</Button>}
      />

      <Card className="p-0">
        {data?.data.length ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-neutral-600">{group.description ?? "—"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-xs text-neutral-600">
                        <span className="size-4 rounded-full border border-neutral-300" style={{ background: group.color ?? "#d4d4d4" }} />
                        {group.color ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(group)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(group)}>
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
            title={data ? "Nenhum grupo encontrado" : "Carregando..."}
            description="Crie um grupo para começar a organizar conteúdos."
            action={<Button onClick={openCreate}>Novo grupo</Button>}
          />
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar grupo" : "Novo grupo"}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="Nome" htmlFor="group-name" error={errors.name}>
            <Input id="group-name" value={form.name} invalid={Boolean(errors.name)} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="Descrição" htmlFor="group-description" error={errors.description}>
            <Textarea id="group-description" value={form.description} invalid={Boolean(errors.description)} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
          <Field label="Cor" htmlFor="group-color" error={errors.color}>
            <Input id="group-color" type="color" value={form.color} invalid={Boolean(errors.color)} onChange={(event) => setForm({ ...form, color: event.target.value })} />
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
        title="Excluir grupo"
        description={`Isso também ocultará conteúdos e notas de "${deleting?.name ?? ""}".`}
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
