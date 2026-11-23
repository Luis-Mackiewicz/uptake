"use client";

import { useCallback, useState } from "react";
import type { Note } from "@/lib/api/types";

type NoteTabStatus = "idle" | "loading" | "saving" | "error";

export interface NoteTab {
  id: number;
  title: string;
  fileName: string;
  contentId: number;
  groupId?: number;
  savedContent: string;
  draft: string;
  status: NoteTabStatus;
  error?: string;
}

export function useNoteTabs() {
  const [tabs, setTabs] = useState<NoteTab[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  const openTab = useCallback((note: Note, groupId?: number) => {
    setTabs((current) => {
      if (current.some((tab) => tab.id === note.id)) return current;
      return [
        ...current,
        {
          id: note.id,
          title: note.title,
          fileName: note.fileName,
          contentId: note.contentId,
          groupId,
          savedContent: note.markdownContent,
          draft: note.markdownContent,
          status: "loading",
        },
      ];
    });
    setActiveId(note.id);
  }, []);

  const hydrateTab = useCallback((note: Note) => {
    setTabs((current) =>
      current.map((tab) => {
        if (tab.id !== note.id) return tab;
        const isPristine = tab.draft === tab.savedContent;
        return {
          ...tab,
          title: note.title,
          fileName: note.fileName,
          contentId: note.contentId,
          savedContent: note.markdownContent,
          draft: isPristine ? note.markdownContent : tab.draft,
          status: "idle",
          error: undefined,
        };
      }),
    );
  }, []);

  const closeTab = useCallback(
    (id: number) => {
      const index = tabs.findIndex((tab) => tab.id === id);
      if (index === -1) return;

      const remaining = tabs.filter((tab) => tab.id !== id);
      setTabs(remaining);
      setActiveId((current) => {
        if (current !== id) return current;
        const neighbor = remaining[Math.min(index, remaining.length - 1)];
        return neighbor ? neighbor.id : null;
      });
    },
    [tabs],
  );

  const activateTab = useCallback((id: number) => {
    setActiveId(id);
  }, []);

  const setDraft = useCallback((id: number, draft: string) => {
    setTabs((current) =>
      current.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              draft,
              error: undefined,
              status: tab.status === "error" ? "idle" : tab.status,
            }
          : tab,
      ),
    );
  }, []);

  const setTabStatus = useCallback((id: number, status: NoteTabStatus) => {
    setTabs((current) => current.map((tab) => (tab.id === id ? { ...tab, status } : tab)));
  }, []);

  const setTabError = useCallback((id: number, error: string) => {
    setTabs((current) => current.map((tab) => (tab.id === id ? { ...tab, status: "error", error } : tab)));
  }, []);

  const markSaved = useCallback((note: Note) => {
    setTabs((current) =>
      current.map((tab) => {
        if (tab.id !== note.id) return tab;
        const isPristine = tab.draft === tab.savedContent;
        return {
          ...tab,
          title: note.title,
          fileName: note.fileName,
          contentId: note.contentId,
          savedContent: note.markdownContent,
          draft: isPristine ? note.markdownContent : tab.draft,
          status: "idle",
          error: undefined,
        };
      }),
    );
  }, []);

  return {
    tabs,
    activeId,
    openTab,
    hydrateTab,
    closeTab,
    activateTab,
    setDraft,
    setTabStatus,
    setTabError,
    markSaved,
  };
}
