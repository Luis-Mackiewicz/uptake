"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/study-groups", label: "Grupos" },
  { href: "/contents", label: "Conteúdos" },
  { href: "/notes", label: "Notas" },
  { href: "/exams", label: "Provas" },
  { href: "/pomodoro", label: "Pomodoro" },
  { href: "/reviews", label: "Revisões" },
  { href: "/cycles", label: "Ciclos" },
  { href: "/settings", label: "Configurações" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-neutral-200 bg-white p-5 lg:block">
        <Link href="/dashboard" className="font-display text-3xl tracking-widest text-neutral-900">
          UPTAKE
        </Link>
        <nav className="mt-8 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition",
                isActive(item.href)
                  ? "bg-lime-100 text-lime-950"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

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
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium",
                  isActive(item.href) ? "bg-lime-100 text-lime-950" : "text-neutral-600",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
