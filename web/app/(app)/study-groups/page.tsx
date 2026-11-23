"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { StudyGroupCard } from "@/components/study-groups/study-group-card";
import { StudyGroupRow } from "@/components/study-groups/study-group-row";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/dialog";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useResourceList } from "@/hooks/use-resource-list";
import { useViewMode } from "@/hooks/use-view-mode";
import { ApiRequestError, api } from "@/lib/api/client";
import type { CreateStudyGroupRequest, MessageResponse, StudyGroup } from "@/lib/api/types";
import { applyApiIssues, nullableTrimmed } from "@/lib/form";
import { groupFormSchema } from "@/lib/schemas";
import type { GroupFormValues } from "@/lib/schemas";

export default function StudyGroupsPage() {
  const router = useRouter();
  const { data, setPage, reload } = useResourceList<StudyGroup>("/study-groups");
  const { notify } = useToast();
  const [view, setView] = useViewMode("uptake:groups-view");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StudyGroup | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<StudyGroup | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: "", description: "" },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", description: "" });
    setDialogOpen(true);
  };

  const openGroup = (group: StudyGroup) => {
    router.push(`/study-groups/${group.id}/contents`);
  };

  const openEdit = (group: StudyGroup) => {
    setEditing(group);
    reset({ name: group.name, description: group.description ?? "" });
    setDialogOpen(true);
  };

  const onSubmit = async (values: GroupFormValues) => {
    const payload: CreateStudyGroupRequest = {
      name: values.name,
      description: nullableTrimmed(values.description),
    };

    try {
      if (editing) await api.patch<StudyGroup>(`/study-groups/${editing.id}`, payload);
      else await api.post<StudyGroup>("/study-groups", payload);
      notify(editing ? "Grupo atualizado" : "Grupo criado", "success");
      setDialogOpen(false);
      reload();
    } catch (error) {
      applyApiIssues(error, setError);
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível salvar", "error");
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
        actions={
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <Button onClick={openCreate}>Novo grupo</Button>
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((group) => (
                    <StudyGroupRow
                      key={group.id}
                      group={group}
                      onOpen={openGroup}
                      onEdit={openEdit}
                      onDelete={setDeleting}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.data.map((group) => (
                <StudyGroupCard
                  key={group.id}
                  group={group}
                  onOpen={openGroup}
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
            title={data ? "Nenhum grupo encontrado" : "Carregando..."}
            description="Crie um grupo para começar a organizar conteúdos."
            action={<Button onClick={openCreate}>Novo grupo</Button>}
          />
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar grupo" : "Novo grupo"}>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Nome" htmlFor="group-name" error={errors.name?.message}>
            <Input id="group-name" invalid={Boolean(errors.name)} {...register("name")} />
          </Field>
          <Field label="Descrição" htmlFor="group-description" error={errors.description?.message}>
            <Textarea id="group-description" invalid={Boolean(errors.description)} {...register("description")} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
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
