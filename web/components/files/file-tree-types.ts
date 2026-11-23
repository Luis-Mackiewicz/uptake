import type { FileTreeContent, FileTreeGroup, FileTreeNote } from "./file-tree-provider";

export type FileTreeAction =
  | { type: "create-group" }
  | { type: "create-content"; group: FileTreeGroup }
  | { type: "create-note"; group: FileTreeGroup; content: FileTreeContent }
  | { type: "rename-group"; group: FileTreeGroup }
  | { type: "rename-content"; group: FileTreeGroup; content: FileTreeContent }
  | { type: "rename-note"; group: FileTreeGroup; content: FileTreeContent; note: FileTreeNote }
  | { type: "delete-group"; group: FileTreeGroup }
  | { type: "delete-content"; group: FileTreeGroup; content: FileTreeContent }
  | { type: "delete-note"; group: FileTreeGroup; content: FileTreeContent; note: FileTreeNote };
