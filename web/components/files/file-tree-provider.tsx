"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useResourceList } from "@/hooks/use-resource-list";
import type { Content, Note, StudyGroup } from "@/lib/api/types";

export interface FileTreeNote {
  id: number;
  title: string;
  fileName: string;
  contentId: number;
  href: string;
  note: Note;
}

export interface FileTreeContent {
  id: number;
  title: string;
  description: string | null;
  studyGroupId: number;
  href: string;
  notes: FileTreeNote[];
}

export interface FileTreeGroup {
  id: number;
  name: string;
  description: string | null;
  href: string;
  contents: FileTreeContent[];
}

interface FileTreeContextValue {
  tree: FileTreeGroup[];
  loading: boolean;
  reload: () => void;
}

const FileTreeContext = createContext<FileTreeContextValue | null>(null);

function byPosition<T extends { position: number; id: number }>(a: T, b: T) {
  return a.position - b.position || a.id - b.id;
}

function buildTree(groups: StudyGroup[], contents: Content[], notes: Note[]): FileTreeGroup[] {
  return [...groups]
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map((group) => {
      const groupHref = `/study-groups/${group.id}/contents`;
      const groupContents = contents
        .filter((content) => content.studyGroupId === group.id)
        .sort(byPosition)
        .map((content): FileTreeContent => {
          const contentHref = `${groupHref}/${content.id}`;
          return {
            id: content.id,
            title: content.title,
            description: content.description,
            studyGroupId: group.id,
            href: contentHref,
            notes: notes
              .filter((note) => note.contentId === content.id)
              .sort(byPosition)
              .map((note): FileTreeNote => ({
                id: note.id,
                title: note.title,
                fileName: note.fileName,
                contentId: note.contentId,
                href: `${contentHref}/notes/${note.id}`,
                note,
              })),
          };
        });

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        href: groupHref,
        contents: groupContents,
      };
    });
}

export function FileTreeProvider({ children }: { children: ReactNode }) {
  const groupsQuery = useResourceList<StudyGroup>("/study-groups", { limit: 100 });
  const contentsQuery = useResourceList<Content>("/contents", { limit: 100 });
  const notesQuery = useResourceList<Note>("/notes", { limit: 100 });
  const reloadGroups = groupsQuery.reload;
  const reloadContents = contentsQuery.reload;
  const reloadNotes = notesQuery.reload;

  const tree = useMemo(
    () =>
      buildTree(
        groupsQuery.data?.data ?? [],
        contentsQuery.data?.data ?? [],
        notesQuery.data?.data ?? [],
      ),
    [groupsQuery.data, contentsQuery.data, notesQuery.data],
  );

  const reload = useCallback(() => {
    reloadGroups();
    reloadContents();
    reloadNotes();
  }, [reloadGroups, reloadContents, reloadNotes]);

  const value = useMemo<FileTreeContextValue>(
    () => ({
      tree,
      loading: groupsQuery.loading || contentsQuery.loading || notesQuery.loading,
      reload,
    }),
    [tree, groupsQuery.loading, contentsQuery.loading, notesQuery.loading, reload],
  );

  return <FileTreeContext.Provider value={value}>{children}</FileTreeContext.Provider>;
}

export function useFileTree() {
  const value = useContext(FileTreeContext);
  if (!value) throw new Error("useFileTree must be used inside FileTreeProvider");
  return value;
}
