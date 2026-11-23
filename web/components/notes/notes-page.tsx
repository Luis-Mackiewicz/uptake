"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { NoteCard } from "@/components/notes/note-card";
import { NoteTableRow } from "@/components/notes/note-table-row";
import { NoteWorkspace } from "@/components/notes/note-workspace";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { SortableProvider } from "@/components/ui/sortable";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useNoteTabs } from "@/hooks/use-note-tabs";
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
  UpdateNoteRequest,
} from "@/lib/api/types";
import { isBlank, isValidPositiveId, validateLength } from "@/lib/validation";

const MAX_NOTE_BYTES = 2 * 1024 * 1024;

type NoteForm = { name: string; contentId: string };
type FormErrors = Partial<Record<keyof NoteForm, string>>;

const emptyForm: NoteForm = { name: "", contentId: "" };

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

export function NotesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentIdParam = Number(searchParams.get("contentId"));
  const selectedContentId = isValidPositiveId(contentIdParam) ? contentIdParam : null;
  const notesQuery = useResourceList<Note>("/notes", {
    contentId: selectedContentId ?? undefined,
  });
  const contentsQuery = useResourceList<Content>("/contents", { limit: 100 });
  const groupsQuery = useResourceList<StudyGroup>("/study-groups", { limit: 100 });
  const { notify } = useToast();
  const workspace = useNoteTabs();
  const [view, setView] = useViewMode("uptake:notes-view");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NoteForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Note | null>(null);
  const [removing, setRemoving] = useState(false);
  const [closingId, setClosingId] = useState<number | null>(null);

  const contents = contentsQuery.data?.data ?? [];
  const groups = groupsQuery.data?.data ?? [];
  const groupName = (id: number) => groups.find((group) => group.id === id)?.name ?? `#${id}`;
  const contentLabel = (content: Content) => `${content.title} · ${groupName(content.studyGroupId)}`;
  const activeTab = workspace.tabs.find((tab) => tab.id === workspace.activeId) ?? null;

  const visibleNotes = (notesQuery.data?.data ?? []).filter((note) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return note.title.toLowerCase().includes(term) || note.fileName.toLowerCase().includes(term);
  });
  const canDragNotes = selectedContentId !== null && !search.trim();
  const noteIds = visibleNotes.map((note) => note.id);

  const handleContentFilterChange = (value: string) => {
    notesQuery.setPage(1);
    router.replace(value ? `/notes?contentId=${value}` : "/notes", { scroll: false });
  };

  const handleReorderNotes = async (ids: number[]) => {
    const current = notesQuery.data;
    if (!selectedContentId || !current) return;
    const byId = new Map(current.data.map((note) => [note.id, note]));
    const ordered = ids
      .map((id) => byId.get(id))
      .filter((note): note is Note => Boolean(note));
    notesQuery.setData({ ...current, data: ordered });

    try {
      const payload: ReorderNotesRequest = { contentId: selectedContentId, ids };
      await api.patch("/notes/reorder", payload);
      notify("Ordem salva", "success");
    } catch (error) {
      notesQuery.setData(current);
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível salvar a ordem", "error");
    }
  };

  const handleOpenNote = useCallback(
    async (note: Note) => {
      const alreadyOpen = workspace.tabs.some((tab) => tab.id === note.id);
      workspace.openTab(note);
      if (alreadyOpen) return;

      try {
        const freshNote = await api.get<Note>(`/notes/${note.id}`);
        workspace.hydrateTab(freshNote);
      } catch (error) {
        workspace.setTabError(note.id, error instanceof ApiRequestError ? error.message : "Não foi possível carregar a nota");
      }
    },
    [workspace],
  );

  const saveActive = useCallback(async () => {
    if (!activeTab || activeTab.status === "saving" || activeTab.status === "loading") return;

    if (isBlank(activeTab.draft)) {
      workspace.setTabError(activeTab.id, "Escreva o conteúdo da nota");
      return;
    }
    if (byteLength(activeTab.draft) > MAX_NOTE_BYTES) {
      workspace.setTabError(activeTab.id, "Nota excede o tamanho máximo de 2 MB");
      return;
    }

    const payload: UpdateNoteRequest = {
      title: activeTab.title,
      fileName: activeTab.fileName,
      contentId: activeTab.contentId,
      markdownContent: activeTab.draft,
    };

    workspace.setTabStatus(activeTab.id, "saving");
    try {
      const saved = await api.patch<Note>(`/notes/${activeTab.id}`, payload);
      workspace.markSaved(saved);
      notesQuery.setData((current) =>
        current
          ? {
              ...current,
              data: current.data.map((item) => (item.id === saved.id ? saved : item)),
            }
          : current,
      );
      notify("Nota salva", "success");
    } catch (error) {
      const firstIssue =
        error instanceof ApiRequestError && error.issues
          ? Object.values(error.issues)
              .flat()
              .at(0)
          : undefined;
      const message =
        firstIssue ?? (error instanceof ApiRequestError ? error.message : "Não foi possível salvar a nota");
      workspace.setTabError(activeTab.id, message);
      notify(message, "error");
    }
  }, [activeTab, notify, notesQuery, workspace]);

  const requestClose = useCallback(
    (id: number) => {
      const tab = workspace.tabs.find((item) => item.id === id);
      if (!tab) return;
      if (tab.draft !== tab.savedContent) {
        setClosingId(id);
        return;
      }
      workspace.closeTab(id);
    },
    [workspace],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const dialogOpenNow = dialogOpen || deleting !== null || closingId !== null;
      if (dialogOpenNow || !workspace.activeId) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveActive();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closingId, dialogOpen, deleting, saveActive, workspace.activeId]);

  const openCreate = () => {
    const defaultContentId = selectedContentId ?? contents[0]?.id;
    setForm({ ...emptyForm, contentId: defaultContentId ? String(defaultContentId) : "" });
    setErrors({});
    setDialogOpen(true);
  };

  const validateCreate = () => {
    const nextErrors: FormErrors = {};
    if (isBlank(form.name)) nextErrors.name = "Informe o nome";
    else if (!validateLength(form.name, 251)) nextErrors.name = "Máximo de 251 caracteres";
    else if (form.name.includes("/") || form.name.includes("\\")) nextErrors.name = "Não use barras no nome";
    if (!isValidPositiveId(Number(form.contentId))) nextErrors.contentId = "Selecione um conteúdo";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateCreate()) return;

    const payload: CreateNoteRequest = {
      name: form.name.trim(),
      contentId: Number(form.contentId),
    };

    setCreating(true);
    try {
      const created = await api.post<Note>("/notes", payload);
      workspace.openTab(created);
      workspace.hydrateTab(created);
      setDialogOpen(false);
      setForm(emptyForm);
      setErrors({});
      notesQuery.reload();
      notify("Nota criada", "success");
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
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await api.delete<MessageResponse>(`/notes/${deleting.id}`);
      workspace.closeTab(deleting.id);
      setDeleting(null);
      notesQuery.reload();
      notify("Nota removida", "success");
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível remover", "error");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notas"
        description="Edite anotações Markdown em várias abas."
        actions={
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <Button onClick={openCreate} disabled={!contents.length}>Nova nota</Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[24rem_minmax(0,1fr)]">
        <Card className="flex min-h-[560px] flex-col p-0">
          <div className="space-y-3 border-b border-neutral-200 p-3">
            <div>
              <label htmlFor="note-content-filter" className="mb-1 block text-xs font-medium text-neutral-600">
                Conteúdo
              </label>
              <Select
                id="note-content-filter"
                value={selectedContentId ? String(selectedContentId) : ""}
                onChange={(event) => handleContentFilterChange(event.target.value)}
              >
                <option value="">Todos os conteúdos</option>
                {contents.map((content) => (
                  <option key={content.id} value={content.id}>
                    {contentLabel(content)}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar nesta página"
              aria-label="Buscar notas"
            />
            {canDragNotes ? (
              <p className="text-xs text-neutral-500">Arraste pela alça para reordenar as notas deste conteúdo.</p>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {visibleNotes.length ? (
              <SortableProvider ids={noteIds} onReorder={(ids) => void handleReorderNotes(ids)}>
                {view === "table" ? (
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
                      {visibleNotes.map((note) => {
                        const tab = workspace.tabs.find((item) => item.id === note.id);
                        const content = contents.find((item) => item.id === note.contentId);
                        return (
                          <NoteTableRow
                            key={note.id}
                            note={note}
                            isActive={workspace.activeId === note.id}
                            isOpen={Boolean(tab)}
                            isDirty={Boolean(tab && tab.draft !== tab.savedContent)}
                            canDrag={canDragNotes}
                            contentLabel={content ? contentLabel(content) : `#${note.contentId}`}
                            onOpen={(item) => void handleOpenNote(item)}
                            onDelete={setDeleting}
                          />
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-1">
                    {visibleNotes.map((note) => {
                      const tab = workspace.tabs.find((item) => item.id === note.id);
                      const content = contents.find((item) => item.id === note.contentId);
                      return (
                        <NoteCard
                          key={note.id}
                          note={note}
                          isActive={workspace.activeId === note.id}
                          isOpen={Boolean(tab)}
                          isDirty={Boolean(tab && tab.draft !== tab.savedContent)}
                          canDrag={canDragNotes}
                          contentLabel={content ? contentLabel(content) : `#${note.contentId}`}
                          onOpen={(item) => void handleOpenNote(item)}
                          onDelete={setDeleting}
                        />
                      );
                    })}
                  </div>
                )}
              </SortableProvider>
            ) : (
              <EmptyState
                className="m-3"
                title={notesQuery.data ? "Nenhuma nota encontrada" : "Carregando..."}
                description={
                  search
                    ? "Nenhum título ou arquivo corresponde à busca nesta página."
                    : contents.length
                      ? "Crie uma nota para abrir no editor."
                      : "Cadastre um conteúdo primeiro."
                }
                action={<Button onClick={openCreate} disabled={!contents.length}>Nova nota</Button>}
              />
            )}
          </div>
          {notesQuery.data ? (
            <div className="p-3">
              <Pagination
                page={notesQuery.data.page}
                totalPages={notesQuery.data.totalPages}
                total={notesQuery.data.total}
                onPageChange={notesQuery.setPage}
              />
            </div>
          ) : null}
        </Card>

        <NoteWorkspace
          tabs={workspace.tabs}
          activeId={workspace.activeId}
          onSelect={workspace.activateTab}
          onRequestClose={requestClose}
          onDraftChange={workspace.setDraft}
          onSave={() => void saveActive()}
        />
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Nova nota">
        <form className="space-y-4" onSubmit={handleCreate} noValidate>
          <Field label="Nome" htmlFor="note-name" error={errors.name} hint="O arquivo será criado com a extensão .md.">
            <Input id="note-name" value={form.name} invalid={Boolean(errors.name)} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="Conteúdo" htmlFor="note-content" error={errors.contentId}>
            <Select id="note-content" value={form.contentId} invalid={Boolean(errors.contentId)} onChange={(event) => setForm({ ...form, contentId: event.target.value })}>
              <option value="">Selecione</option>
              {contents.map((content) => (
                <option key={content.id} value={content.id}>{contentLabel(content)}</option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={creating}>
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
        loading={removing}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />

      <ConfirmDialog
        open={closingId !== null}
        title="Fechar nota"
        description="Esta nota tem alterações não salvas. Deseja descartá-las?"
        confirmLabel="Descartar e fechar"
        onConfirm={() => {
          if (closingId !== null) workspace.closeTab(closingId);
          setClosingId(null);
        }}
        onClose={() => setClosingId(null)}
      />
    </div>
  );
}
