"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NoteWorkspace } from "@/components/notes/note-workspace";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useNoteTabs } from "@/hooks/use-note-tabs";
import { useResourceList } from "@/hooks/use-resource-list";
import { ApiRequestError, api } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import type { Content, CreateNoteRequest, MessageResponse, Note, StudyGroup } from "@/lib/api/types";
import { isBlank, isValidPositiveId, validateLength } from "@/lib/validation";

const MAX_NOTE_BYTES = 2 * 1024 * 1024;

type NoteForm = { title: string; fileName: string; contentId: string; markdownContent: string };
type FormErrors = Partial<Record<keyof NoteForm, string>>;

const emptyForm: NoteForm = { title: "", fileName: "", contentId: "", markdownContent: "" };

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

export function NotesPageContent() {
  const notesQuery = useResourceList<Note>("/notes");
  const contentsQuery = useResourceList<Content>("/contents", { limit: 100 });
  const groupsQuery = useResourceList<StudyGroup>("/study-groups", { limit: 100 });
  const { notify } = useToast();
  const workspace = useNoteTabs();
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

    const payload: CreateNoteRequest = {
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
    setForm({ ...emptyForm, contentId: contents[0] ? String(contents[0].id) : "" });
    setErrors({});
    setDialogOpen(true);
  };

  const validateCreate = () => {
    const nextErrors: FormErrors = {};
    if (isBlank(form.title)) nextErrors.title = "Informe o título";
    else if (!validateLength(form.title, 200)) nextErrors.title = "Máximo de 200 caracteres";
    if (isBlank(form.fileName)) nextErrors.fileName = "Informe o nome do arquivo";
    else if (!validateLength(form.fileName, 255)) nextErrors.fileName = "Máximo de 255 caracteres";
    else if (form.fileName.includes("/") || form.fileName.includes("\\")) nextErrors.fileName = "Não use barras no nome";
    if (!isValidPositiveId(Number(form.contentId))) nextErrors.contentId = "Selecione um conteúdo";
    if (isBlank(form.markdownContent)) nextErrors.markdownContent = "Escreva o conteúdo da nota";
    else if (byteLength(form.markdownContent) > MAX_NOTE_BYTES) nextErrors.markdownContent = "Nota excede o tamanho máximo de 2 MB";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateCreate()) return;

    const payload: CreateNoteRequest = {
      title: form.title.trim(),
      fileName: form.fileName.trim(),
      contentId: Number(form.contentId),
      markdownContent: form.markdownContent,
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
        actions={<Button onClick={openCreate} disabled={!contents.length}>Nova nota</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="flex min-h-[560px] flex-col p-0">
          <div className="border-b border-neutral-200 p-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar nesta página"
              aria-label="Buscar notas"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {visibleNotes.length ? (
              visibleNotes.map((note) => {
                const tab = workspace.tabs.find((item) => item.id === note.id);
                const isActive = workspace.activeId === note.id;
                const content = contents.find((item) => item.id === note.contentId);
                return (
                  <div
                    key={note.id}
                    className={cn(
                      "flex items-center gap-2 border-b border-neutral-200 px-3 py-2",
                      isActive && "bg-lime-50",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void handleOpenNote(note)}
                      className="min-w-0 flex-1 rounded-md px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600"
                    >
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-neutral-900">{note.title}</span>
                        {tab && tab.draft !== tab.savedContent ? (
                          <span className="text-xs text-amber-600" title="Alterações não salvas">●</span>
                        ) : null}
                        {isActive ? <Badge tone="lime">Ativa</Badge> : tab ? <Badge>Aberta</Badge> : null}
                      </span>
                      <span className="block truncate font-mono text-xs text-neutral-500">{note.fileName}</span>
                      <span className="block truncate text-xs text-neutral-500">
                        {content ? contentLabel(content) : `#${note.contentId}`}
                      </span>
                    </button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(note)}>
                      Excluir
                    </Button>
                  </div>
                );
              })
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Nova nota" className="max-w-3xl">
        <form className="space-y-4" onSubmit={handleCreate} noValidate>
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
            <Textarea id="note-markdown" className="min-h-48 font-mono text-xs" value={form.markdownContent} invalid={Boolean(errors.markdownContent)} onChange={(event) => setForm({ ...form, markdownContent: event.target.value })} />
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
