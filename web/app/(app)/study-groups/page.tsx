"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudyGroupCard } from "@/components/study-groups/study-group-card";
import { StudyGroupRow } from "@/components/study-groups/study-group-row";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useResourceList } from "@/hooks/use-resource-list";
import { useViewMode } from "@/hooks/use-view-mode";
import { api } from "@/lib/api/client";
import { friendlyApiMessage } from "@/lib/api/errors";
import type { MessageResponse, StudyGroup } from "@/lib/api/types";

export default function StudyGroupsPage() {
  const router = useRouter();
  const { data, setPage, reload } = useResourceList<StudyGroup>("/study-groups");
  const { notify } = useToast();
  const [view, setView] = useViewMode("uptake:groups-view");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<StudyGroup | null>(null);

  const openCreate = () => {
    router.push("/study-groups/new");
  };

  const openGroup = (group: StudyGroup) => {
    router.push(`/study-groups/${group.id}/contents`);
  };

  const openEdit = (group: StudyGroup) => {
    router.push(`/study-groups/${group.id}/edit`);
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
      notify(friendlyApiMessage(error, "Não foi possível remover"), "error");
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
