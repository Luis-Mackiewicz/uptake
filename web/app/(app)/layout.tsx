import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { FileTreeProvider } from "@/components/files/file-tree-provider";
import { AppShell } from "@/components/layout/app-shell";
import { NoteTabsProvider } from "@/components/notes/note-tabs-provider";
import { PomodoroProvider } from "@/components/pomodoro/pomodoro-provider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <PomodoroProvider>
        <NoteTabsProvider>
          <FileTreeProvider>
            <AppShell>{children}</AppShell>
          </FileTreeProvider>
        </NoteTabsProvider>
      </PomodoroProvider>
    </ProtectedRoute>
  );
}
