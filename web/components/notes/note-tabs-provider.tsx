"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useNoteTabs } from "@/hooks/use-note-tabs";

type NoteTabsContextValue = ReturnType<typeof useNoteTabs>;

const NoteTabsContext = createContext<NoteTabsContextValue | null>(null);

export function NoteTabsProvider({ children }: { children: ReactNode }) {
  const value = useNoteTabs();
  return <NoteTabsContext.Provider value={value}>{children}</NoteTabsContext.Provider>;
}

export function useNoteTabsContext() {
  const value = useContext(NoteTabsContext);
  if (!value) throw new Error("useNoteTabsContext must be used inside NoteTabsProvider");
  return value;
}
