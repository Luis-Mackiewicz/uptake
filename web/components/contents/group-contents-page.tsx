"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { ContentCard } from "./content-card";
import { ContentRow } from "./content-row";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { SortableProvider } from "@/components/ui/sortable";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useResourceList } from "@/hooks/use-resource-list";
import { useViewMode } from "@/hooks/use-view-mode";
import { ApiRequestError, api } from "@/lib/api/client";
import type {
  Content,
  CreateContentRequest,
  MessageResponse,
  ReorderContentsRequest,
  StudyGroup,
} from "@/lib/api/types";
import { applyApiIssues, nullableTrimmed } from "@/lib/form";
import { contentFormSchema } from "@/lib/schemas";
import type { ContentFormValues } from "@/lib/schemas";

export function GroupContentsPage({ groupId }: { groupId: number }) {
  const router = useRouter();
  const { notify } = useToast();
  const [group, setGroup] = useState<StudyGroup | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const result = await api.get<StudyGroup>(`/study-groups/${groupId}`);
        if (active) setGroup(result);
      } catch (error) {
        if (!active) return;
        notify(
          error instanceof ApiRequestError && error.status === 404
            ? "Grupo não encontrado"
            : "Não foi possível carregar o grupo",
          "error",
        );
        router.replace("/study-groups");
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [groupId, notify, router]);

  if (!group) {
    return (
      <Card className="p-6">
        <p className="text-sm text-neutral-600">Carregando grupo...</p>
      </Card>
    );
  }

  return <GroupContents group={group} />;
}

function GroupContents({ group }: { group: StudyGroup }) {
  const { data, setData, setPage, reload } = useResourceList<Content>("/contents", {
    studyGroupId: group.id,
  });
  const { notify } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Content | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Content | null>(null);
  const [view, setView] = useViewMode("uptake:contents-view");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: { title: "", description: "" },
  });

  const handleReorder = async (ids: number[]) => {
    const current = data;
    if (!current) return;
    const byId = new Map(current.data.map((content) => [content.id, content]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((content): content is Content => Boolean(content));
    setData({ ...current, data: ordered });

    try {
      const payload: ReorderContentsRequest = { studyGroupId: group.id, ids };
      await api.patch("/contents/reorder", payload);
      notify("Ordem salva", "success");
    } catch (error) {
      setData(current);
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível salvar a ordem", "error");
    }
  };

  const openCreate = () => {
    setEditing(null);
    reset({ title: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (content: Content) => {
    setEditing(content);
    reset({ title: content.title, description: content.description ?? "" });
    setDialogOpen(true);
  };

  const onSubmit = async (values: ContentFormValues) => {
    const payload: CreateContentRequest = {
      title: values.title,
      description: nullableTrimmed(values.description),
      studyGroupId: group.id,
    };

    try {
      if (editing) await api.patch<Content>(`/contents/${editing.id}`, payload);
      else await api.post<Content>("/contents", payload);
      notify(editing ? "Conteúdo atualizado" : "Conteúdo criado", "success");
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

  const ids = data?.data.map((content) => content.id) ?? [];

  return (
    <div>
      <PageHeader
        title={`Conteúdos de ${group.name}`}
        description="Cadastre os temas estudados neste grupo."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <Link href="/study-groups">
              <Button variant="secondary">
                <ArrowLeft size={16} aria-hidden />
                Voltar
              </Button>
            </Link>
            <Button onClick={openCreate}>
              <Plus size={16} aria-hidden />
              Novo conteúdo
            </Button>
          </div>
        }
      />

      {data?.data.length ? (
        <>
          {view === "table" ? (
            <SortableProvider ids={ids} onReorder={handleReorder}>
              <Card className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 px-2">
                        <span className="sr-only">Arrastar</span>
                      </TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((content) => (
                      <ContentRow
                        key={content.id}
                        content={content}
                        onEdit={openEdit}
                        onDelete={setDeleting}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </SortableProvider>
          ) : (
            <SortableProvider ids={ids} onReorder={handleReorder}>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.data.map((content) => (
                  <ContentCard
                    key={content.id}
                    content={content}
                    onEdit={openEdit}
                    onDelete={setDeleting}
                  />
                ))}
              </div>
            </SortableProvider>
          )}
          <div className="mt-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
          </div>
        </>
      ) : (
        <Card>
          <EmptyState
            title={data ? "Nenhum conteúdo encontrado" : "Carregando..."}
            description="Cadastre um conteúdo para anexar notas."
            action={<Button onClick={openCreate}>Novo conteúdo</Button>}
          />
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar conteúdo" : "Novo conteúdo"}>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Título" htmlFor="content-title" error={errors.title?.message}>
            <Input id="content-title" invalid={Boolean(errors.title)} {...register("title")} />
          </Field>
          <Field label="Descrição" htmlFor="content-description" error={errors.description?.message}>
            <Textarea id="content-description" invalid={Boolean(errors.description)} {...register("description")} />
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
