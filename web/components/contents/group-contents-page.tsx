"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { ContentCard } from "./content-card";
import { ContentRow } from "./content-row";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SortableProvider } from "@/components/ui/sortable";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useResourceList } from "@/hooks/use-resource-list";
import { useViewMode } from "@/hooks/use-view-mode";
import { ApiRequestError, api } from "@/lib/api/client";
import { friendlyApiMessage } from "@/lib/api/errors";
import type {
  Content,
  MessageResponse,
  ReorderContentsRequest,
  StudyGroup,
} from "@/lib/api/types";

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
        notify(friendlyApiMessage(error, "Não foi possível carregar o grupo"), "error");
        if (error instanceof ApiRequestError && error.status === 404) router.replace("/study-groups");
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
  const router = useRouter();
  const { data, setData, setPage, reload } = useResourceList<Content>("/contents", {
    studyGroupId: group.id,
  });
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Content | null>(null);
  const [view, setView] = useViewMode("uptake:contents-view");

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
      notify(friendlyApiMessage(error, "Não foi possível salvar a ordem"), "error");
    }
  };

  const openCreate = () => {
    router.push(`/study-groups/${group.id}/contents/new`);
  };

  const openEdit = (content: Content) => {
    router.push(`/study-groups/${group.id}/contents/${content.id}/edit`);
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
      notify(friendlyApiMessage(error, "Não foi possível remover"), "error");
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
