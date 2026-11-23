"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { ApiRequestError, api } from "@/lib/api/client";
import type { Note } from "@/lib/api/types";
import { useNoteTabs } from "@/hooks/use-note-tabs";

type NoteTabsContextValue = ReturnType<typeof useNoteTabs> & {
  openNote: (note: Note, groupId?: number) => Promise<void>;
};

const NoteTabsContext = createContext<NoteTabsContextValue | null>(null);

export function NoteTabsProvider({ children }: { children: ReactNode }) {
  const tabs = useNoteTabs();
  const { openTab, hydrateTab, setTabError } = tabs;

  const openNote = useCallback(
    async (note: Note, groupId?: number) => {
      openTab(note, groupId);
      try {
        const freshNote = await api.get<Note>(`/notes/${note.id}`);
        hydrateTab(freshNote);
      } catch (error) {
        setTabError(
          note.id,
          error instanceof ApiRequestError ? error.message : "Não foi possível carregar a nota",
        );
      }
    },
    [openTab, hydrateTab, setTabError],
  );

  const value = useMemo<NoteTabsContextValue>(() => ({ ...tabs, openNote }), [tabs, openNote]);

  return <NoteTabsContext.Provider value={value}>{children}</NoteTabsContext.Provider>;
}

export function useNoteTabsContext() {
  const value = useContext(NoteTabsContext);
  if (!value) throw new Error("useNoteTabsContext must be used inside NoteTabsProvider");
  return value;
}
