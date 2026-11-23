"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useResourceList } from "@/hooks/use-resource-list";
import type { Content, Note, Page, StudyGroup } from "@/lib/api/types";
import { RESOURCE_CHANGED_EVENT } from "@/lib/events";

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

interface FileTreePagination {
  page: number;
  totalPages: number;
  total: number;
  setPage: (page: number) => void;
}

interface FileTreeContextValue {
  tree: FileTreeGroup[];
  loading: boolean;
  reload: () => void;
  groups: FileTreePagination;
  contents: FileTreePagination;
  notes: FileTreePagination;
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

function toPagination(query: {
  page: number;
  data: Page<unknown> | null;
  setPage: (page: number) => void;
}): FileTreePagination {
  return {
    page: query.page,
    totalPages: query.data?.totalPages ?? 0,
    total: query.data?.total ?? 0,
    setPage: query.setPage,
  };
}

export function FileTreeProvider({ children }: { children: ReactNode }) {
  const groupsQuery = useResourceList<StudyGroup>("/study-groups");
  const contentsQuery = useResourceList<Content>("/contents");
  const notesQuery = useResourceList<Note>("/notes");

  const reloadGroups = groupsQuery.reload;
  const reloadContents = contentsQuery.reload;
  const reloadNotes = notesQuery.reload;

  const reload = useCallback(() => {
    reloadGroups();
    reloadContents();
    reloadNotes();
  }, [reloadGroups, reloadContents, reloadNotes]);

  useEffect(() => {
    window.addEventListener(RESOURCE_CHANGED_EVENT, reload);
    return () => window.removeEventListener(RESOURCE_CHANGED_EVENT, reload);
  }, [reload]);

  const tree = useMemo(
    () =>
      buildTree(
        groupsQuery.data?.data ?? [],
        contentsQuery.data?.data ?? [],
        notesQuery.data?.data ?? [],
      ),
    [groupsQuery.data, contentsQuery.data, notesQuery.data],
  );

  const value = useMemo<FileTreeContextValue>(
    () => ({
      tree,
      loading: groupsQuery.loading || contentsQuery.loading || notesQuery.loading,
      reload,
      groups: toPagination(groupsQuery),
      contents: toPagination(contentsQuery),
      notes: toPagination(notesQuery),
    }),
    [tree, groupsQuery, contentsQuery, notesQuery, reload],
  );

  return <FileTreeContext.Provider value={value}>{children}</FileTreeContext.Provider>;
}

export function useFileTree() {
  const value = useContext(FileTreeContext);
  if (!value) throw new Error("useFileTree must be used inside FileTreeProvider");
  return value;
}
