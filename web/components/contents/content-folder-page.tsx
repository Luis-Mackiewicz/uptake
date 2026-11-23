"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { NoteCard } from "@/components/notes/note-card";
import { NoteTableRow } from "@/components/notes/note-table-row";
import { useNoteTabsContext } from "@/components/notes/note-tabs-provider";
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
import { useFileTree } from "@/components/files/file-tree-provider";
import { PageHeader } from "@/components/layout/page-header";
import { useResourceList } from "@/hooks/use-resource-list";
import { useViewMode } from "@/hooks/use-view-mode";
import { ApiRequestError, api } from "@/lib/api/client";
import type {
  Content,
  CreateNoteRequest,
  MessageResponse,
  Note,
  ReorderNotesRequest,
  StudyGroup,
} from "@/lib/api/types";
import { isBlank, validateLength } from "@/lib/validation";

const MAX_NOTE_BYTES = 2 * 1024 * 1024;

type NoteForm = { title: string; fileName: string; markdownContent: string };
type FormErrors = Partial<Record<keyof NoteForm, string>>;
const emptyForm: NoteForm = { title: "", fileName: "", markdownContent: "" };

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

export function ContentFolderPage({ groupId, contentId }: { groupId: number; contentId: number }) {
  const router = useRouter();
  const { notify } = useToast();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [content, setContent] = useState<Content | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [groupResult, contentResult] = await Promise.all([
          api.get<StudyGroup>(`/study-groups/${groupId}`),
          api.get<Content>(`/contents/${contentId}`),
        ]);
        if (contentResult.studyGroupId !== groupId) throw new ApiRequestError(404, "Conteúdo não pertence ao grupo");
        if (active) {
          setGroup(groupResult);
          setContent(contentResult);
        }
      } catch (error) {
        if (!active) return;
        notify(
          error instanceof ApiRequestError && error.status === 404
            ? "Conteúdo não encontrado neste grupo"
            : "Não foi possível carregar o conteúdo",
          "error",
        );
        router.replace("/study-groups");
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [groupId, contentId, notify, router]);

  if (!group || !content) {
    return (
      <Card className="p-6">
        <p className="text-sm text-neutral-600">Carregando pasta...</p>
      </Card>
    );
  }

  return <ContentFolder group={group} content={content} />;
}

function ContentFolder({ group, content }: { group: StudyGroup; content: Content }) {
  const router = useRouter();
  const { notify } = useToast();
  const { openNote, tabs, activeId, closeTab } = useNoteTabsContext();
  const { reload: reloadFileTree } = useFileTree();
  const notesQuery = useResourceList<Note>("/notes", { contentId: content.id });
  const [view, setView] = useViewMode("uptake:content-files-view");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NoteForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Note | null>(null);

  const contentHref = `/study-groups/${group.id}/contents/${content.id}`;
  const notes = notesQuery.data?.data ?? [];

  const handleOpenNote = useCallback(
    async (note: Note) => {
      await openNote(note, group.id);
      router.push(`${contentHref}/notes/${note.id}`);
    },
    [openNote, group.id, contentHref, router],
  );

  const handleReorder = async (ids: number[]) => {
    const current = notesQuery.data;
    if (!current) return;
    const byId = new Map(current.data.map((note) => [note.id, note]));
    notesQuery.setData({
      ...current,
      data: ids.map((id) => byId.get(id)).filter((note): note is Note => Boolean(note)),
    });

    try {
      const payload: ReorderNotesRequest = { contentId: content.id, ids };
      await api.patch("/notes/reorder", payload);
      reloadFileTree();
      notify("Ordem salva", "success");
    } catch (error) {
      notesQuery.setData(current);
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível salvar a ordem", "error");
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
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
    if (isBlank(form.markdownContent)) nextErrors.markdownContent = "Escreva o conteúdo da nota";
    else if (byteLength(form.markdownContent) > MAX_NOTE_BYTES) nextErrors.markdownContent = "Nota excede o tamanho máximo de 2 MB";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: CreateNoteRequest = {
      title: form.title.trim(),
      fileName: form.fileName.trim(),
      contentId: content.id,
      markdownContent: form.markdownContent,
    };

    setSaving(true);
    try {
      const created = await api.post<Note>("/notes", payload);
      notesQuery.reload();
      reloadFileTree();
      setDialogOpen(false);
      setForm(emptyForm);
      notify("Nota criada", "success");
      void handleOpenNote(created);
    } catch (error) {
      if (error instanceof ApiRequestError && error.issues) {
        const apiErrors: FormErrors = {};
        Object.entries(error.issues).forEach(([key, messages]) => {
          if (key in form) apiErrors[key as keyof NoteForm] = messages[0];
        });
        setErrors(apiErrors);
      }
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível criar a nota", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await api.delete<MessageResponse>(`/notes/${deleting.id}`);
      closeTab(deleting.id);
      setDeleting(null);
      notesQuery.reload();
      reloadFileTree();
      notify("Nota removida", "success");
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível remover", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={content.title}
        description={`Arquivos Markdown de ${group.name}.`}
        breadcrumbs={[
          { label: "Grupos", href: "/study-groups" },
          { label: group.name, href: `/study-groups/${group.id}/contents` },
          { label: content.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <Button onClick={openCreate}>Nova nota</Button>
          </div>
        }
      />

      {notes.length ? (
        <SortableProvider ids={notes.map((note) => note.id)} onReorder={(ids) => void handleReorder(ids)}>
          {view === "table" ? (
            <Card className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 px-2">
                      <span className="sr-only">Arrastar</span>
                    </TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead className="w-10 text-right">
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.map((note) => {
                    const tab = tabs.find((item) => item.id === note.id);
                    return (
                      <NoteTableRow
                        key={note.id}
                        note={note}
                        isActive={activeId === note.id}
                        isOpen={Boolean(tab)}
                        isDirty={Boolean(tab && tab.draft !== tab.savedContent)}
                        canDrag
                        contentLabel={content.title}
                        onOpen={(item) => void handleOpenNote(item)}
                        onDelete={setDeleting}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {notes.map((note) => {
                const tab = tabs.find((item) => item.id === note.id);
                return (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isActive={activeId === note.id}
                    isOpen={Boolean(tab)}
                    isDirty={Boolean(tab && tab.draft !== tab.savedContent)}
                    canDrag
                    contentLabel={content.title}
                    onOpen={(item) => void handleOpenNote(item)}
                    onDelete={setDeleting}
                  />
                );
              })}
            </div>
          )}
        </SortableProvider>
      ) : (
        <Card>
          <EmptyState
            title={notesQuery.data ? "Nenhuma nota nesta pasta" : "Carregando..."}
            description="Crie um arquivo Markdown para começar."
            action={<Button onClick={openCreate}>Nova nota</Button>}
          />
        </Card>
      )}

      {notesQuery.data ? (
        <div className="mt-4">
          <Pagination
            page={notesQuery.data.page}
            totalPages={notesQuery.data.totalPages}
            total={notesQuery.data.total}
            onPageChange={notesQuery.setPage}
          />
        </div>
      ) : null}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Nova nota" className="max-w-3xl">
        <form className="space-y-4" onSubmit={handleCreate} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" htmlFor="folder-note-title" error={errors.title}>
              <Input id="folder-note-title" value={form.title} invalid={Boolean(errors.title)} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </Field>
            <Field label="Arquivo" htmlFor="folder-note-file" error={errors.fileName} hint="Ex.: resumo.md">
              <Input id="folder-note-file" value={form.fileName} invalid={Boolean(errors.fileName)} onChange={(event) => setForm({ ...form, fileName: event.target.value })} />
            </Field>
          </div>
          <Field label="Markdown" htmlFor="folder-note-markdown" error={errors.markdownContent}>
            <Textarea id="folder-note-markdown" className="min-h-48 font-mono text-xs" value={form.markdownContent} invalid={Boolean(errors.markdownContent)} onChange={(event) => setForm({ ...form, markdownContent: event.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Criar
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
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
