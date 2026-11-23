import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { PomodoroProvider } from "@/components/pomodoro/pomodoro-provider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <PomodoroProvider>
        <AppShell>{children}</AppShell>
      </PomodoroProvider>
    </ProtectedRoute>
  );
}
