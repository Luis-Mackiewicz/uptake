"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFileTree } from "@/components/files/file-tree-provider";
import { NoteWorkspace } from "@/components/notes/note-workspace";
import { useNoteTabsContext } from "@/components/notes/note-tabs-provider";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ApiRequestError, api } from "@/lib/api/client";
import type { Content, Note, StudyGroup, UpdateNoteRequest } from "@/lib/api/types";
import { isBlank } from "@/lib/validation";

const MAX_NOTE_BYTES = 2 * 1024 * 1024;

function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

export function NoteFilePage({
  groupId,
  contentId,
  noteId,
}: {
  groupId: number;
  contentId: number;
  noteId: number;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const {
    tabs,
    activeId,
    openNote,
    activateTab,
    closeTab,
    setDraft,
    setTabStatus,
    setTabError,
    markSaved,
  } = useNoteTabsContext();
  const { reload: reloadFileTree } = useFileTree();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [closingId, setClosingId] = useState<number | null>(null);

  const contentHref = `/study-groups/${groupId}/contents/${contentId}`;
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? null;

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [groupResult, contentResult, noteResult] = await Promise.all([
          api.get<StudyGroup>(`/study-groups/${groupId}`),
          api.get<Content>(`/contents/${contentId}`),
          api.get<Note>(`/notes/${noteId}`),
        ]);
        if (contentResult.studyGroupId !== groupId || noteResult.contentId !== contentId) {
          throw new ApiRequestError(404, "Nota não encontrada neste conteúdo");
        }
        if (active) {
          setGroup(groupResult);
          setContent(contentResult);
          setNote(noteResult);
        }
      } catch (error) {
        if (!active) return;
        notify(
          error instanceof ApiRequestError && error.status === 404
            ? "Nota não encontrada nesta pasta"
            : "Não foi possível carregar a nota",
          "error",
        );
        router.replace(contentHref);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [groupId, contentId, noteId, notify, router, contentHref]);

  useEffect(() => {
    if (!note || !group) return;
    void openNote(note, group.id);
    activateTab(note.id);
  }, [note, group, openNote, activateTab]);

  const saveActive = useCallback(async () => {
    if (!activeTab || activeTab.status === "saving" || activeTab.status === "loading") return;

    if (isBlank(activeTab.draft)) {
      setTabError(activeTab.id, "Escreva o conteúdo da nota");
      return;
    }
    if (byteLength(activeTab.draft) > MAX_NOTE_BYTES) {
      setTabError(activeTab.id, "Nota excede o tamanho máximo de 2 MB");
      return;
    }

    const payload: UpdateNoteRequest = {
      title: activeTab.title,
      fileName: activeTab.fileName,
      contentId: activeTab.contentId,
      markdownContent: activeTab.draft,
    };

    setTabStatus(activeTab.id, "saving");
    try {
      const saved = await api.patch<Note>(`/notes/${activeTab.id}`, payload);
      markSaved(saved);
      setNote((current) => (current?.id === saved.id ? saved : current));
      reloadFileTree();
      notify("Nota salva", "success");
    } catch (error) {
      const firstIssue =
        error instanceof ApiRequestError && error.issues
          ? Object.values(error.issues)
              .flat()
              .at(0)
          : undefined;
      const message =
        firstIssue ??
        (error instanceof ApiRequestError ? error.message : "Não foi possível salvar a nota");
      setTabError(activeTab.id, message);
      notify(message, "error");
    }
  }, [activeTab, setTabStatus, markSaved, reloadFileTree, notify, setTabError]);

  const finishClose = useCallback(
    (id: number) => {
      closeTab(id);
      if (id === noteId) router.push(contentHref);
    },
    [closeTab, noteId, router, contentHref],
  );

  const requestClose = useCallback(
    (id: number) => {
      const tab = tabs.find((item) => item.id === id);
      if (!tab) return;
      if (tab.draft !== tab.savedContent) {
        setClosingId(id);
        return;
      }
      finishClose(id);
    },
    [tabs, finishClose],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (closingId !== null || !activeId) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveActive();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closingId, activeId, saveActive]);

  if (!group || !content || !note) {
    return (
      <Card className="p-6">
        <p className="text-sm text-neutral-600">Carregando nota...</p>
      </Card>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[520px] flex-col">
      <div className="min-h-0 flex-1">
        <NoteWorkspace
          tabs={tabs}
          activeId={activeId ?? noteId}
          breadcrumbs={[
            { label: "Grupos", href: "/study-groups" },
            { label: group.name, href: `/study-groups/${group.id}/contents` },
            { label: content.title, href: contentHref },
            { label: activeTab?.fileName ?? note.fileName },
          ]}
          onSelect={(id) => {
            const tab = tabs.find((item) => item.id === id);
            activateTab(id);
            if (!tab) return;
            const tabGroupId = tab.groupId ?? group.id;
            router.push(`/study-groups/${tabGroupId}/contents/${tab.contentId}/notes/${tab.id}`);
          }}
          onRequestClose={requestClose}
          onDraftChange={setDraft}
          onSave={() => void saveActive()}
        />
      </div>

      <ConfirmDialog
        open={closingId !== null}
        title="Fechar nota"
        description="Esta nota tem alterações não salvas. Deseja descartá-las?"
        confirmLabel="Descartar e fechar"
        onConfirm={() => {
          if (closingId !== null) finishClose(closingId);
          setClosingId(null);
        }}
        onClose={() => setClosingId(null)}
      />
    </div>
  );
}
