"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  RefreshCw,
  Repeat2,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PomodoroMobile } from "@/components/pomodoro/pomodoro-mobile";
import { PomodoroWidget } from "@/components/pomodoro/pomodoro-widget";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const navigation: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/study-groups", label: "Grupos", icon: FolderOpen },
  { href: "/exams", label: "Provas", icon: ClipboardList },
  { href: "/reviews", label: "Revisões", icon: RefreshCw },
  { href: "/cycles", label: "Ciclos", icon: Repeat2 },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-neutral-200 bg-white p-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Link href="/dashboard" className="shrink-0 font-display text-3xl tracking-widest text-neutral-900">
          UPTAKE
        </Link>
        <nav className="mt-8 min-h-0 flex-1 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                  isActive(item.href)
                    ? "bg-lime-100 text-lime-950"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                )}
              >
                <Icon size={16} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto shrink-0 border-t border-neutral-200 pt-4">
          <PomodoroWidget />
        </div>
      </aside>

      <PomodoroMobile />

      <div className="flex min-h-screen flex-col">
        <header className="border-b border-neutral-200 bg-white">
          <div className="flex h-16 items-center justify-between gap-4 px-6">
            <Link href="/dashboard" className="font-display text-2xl tracking-widest lg:hidden">
              UPTAKE
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <span className="hidden text-sm text-neutral-600 sm:inline">
                {user ? `${user.firstName} ${user.lastName}` : null}
              </span>
              <Button variant="secondary" size="sm" onClick={logout}>
                Sair
              </Button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-neutral-100 px-4 py-2 lg:hidden">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium",
                    isActive(item.href) ? "bg-lime-100 text-lime-950" : "text-neutral-600",
                  )}
                >
                  <Icon size={14} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
