"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api/client";
import type { Page } from "@/lib/api/types";

interface Counts {
  groups: number;
  contents: number;
  notes: number;
  exams: number;
  dueReviews: number;
  cycles: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [groups, contents, notes, exams, reviews, cycles] = await Promise.all([
          api.get<Page<unknown>>("/study-groups", { limit: 1 }),
          api.get<Page<unknown>>("/contents", { limit: 1 }),
          api.get<Page<unknown>>("/notes", { limit: 1 }),
          api.get<Page<unknown>>("/exams", { limit: 1 }),
          api.get<Page<unknown>>("/reviews", { due: true, limit: 1 }),
          api.get<Page<unknown>>("/study-cycles", { limit: 1 }),
        ]);

        if (!active) return;
        setCounts({
          groups: groups.total,
          contents: contents.total,
          notes: notes.total,
          exams: exams.total,
          dueReviews: reviews.total,
          cycles: cycles.total,
        });
      } catch {
        if (active) notify("Não foi possível carregar o resumo", "error");
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [notify]);

  const cards = [
    { label: "Grupos", value: counts?.groups, href: "/study-groups" },
    { label: "Conteúdos", value: counts?.contents, href: "/contents" },
    { label: "Notas", value: counts?.notes, href: "/notes" },
    { label: "Provas", value: counts?.exams, href: "/exams" },
    { label: "Revisões pendentes", value: counts?.dueReviews, href: "/reviews" },
    { label: "Ciclos", value: counts?.cycles, href: "/cycles" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={user ? `Olá, ${user.firstName} ${user.lastName}. Veja o panorama dos seus estudos.` : undefined}
        actions={
          <Link href="/study-groups">
            <Button>Novo grupo</Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-lime-400">
              <CardHeader>
                <CardTitle className="text-base font-medium uppercase tracking-wider text-neutral-500">
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-5xl tracking-wide text-neutral-900">
                  {card.value === undefined ? "—" : card.value}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
