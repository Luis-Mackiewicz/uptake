"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiRequestError, api } from "@/lib/api/client";
import type { Page } from "@/lib/api/types";

const resources = [
  { key: "groups", label: "Grupos", href: "/study-groups", path: "/study-groups" },
  { key: "exams", label: "Provas e ciclos", href: "/exams", path: "/exams" },
] as const;

type SummaryKey = (typeof resources)[number]["key"];

interface SummaryItem {
  value?: number;
  error?: string;
  loading: boolean;
}

const initialSummary: Record<SummaryKey, SummaryItem> = {
  groups: { loading: true },
  exams: { loading: true },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Record<SummaryKey, SummaryItem>>(initialSummary);

  const loadResource = useCallback(async (key: SummaryKey, path: string) => {
    setSummary((current) => ({
      ...current,
      [key]: { ...current[key], loading: true, error: undefined },
    }));

    try {
      const response = await api.get<Page<unknown>>(path, { limit: 1 });
      setSummary((current) => ({
        ...current,
        [key]: { value: response.total, loading: false },
      }));
    } catch (error) {
      setSummary((current) => ({
        ...current,
        [key]: {
          loading: false,
          error: error instanceof ApiRequestError ? error.message : "Não foi possível carregar",
        },
      }));
    }
  }, []);

  const loadSummary = useCallback(async () => {
    await Promise.all(resources.map((resource) => loadResource(resource.key, resource.path)));
  }, [loadResource]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

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
      <div className="grid gap-4 sm:grid-cols-2">
        {resources.map((resource) => {
          const item = summary[resource.key];

          return (
            <Card key={resource.key} className="h-full transition hover:-translate-y-0.5 hover:border-lime-400">
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <Link href={resource.href} className="min-w-0 flex-1">
                  <CardTitle className="text-base font-medium uppercase tracking-wider text-neutral-500">
                    {resource.label}
                  </CardTitle>
                </Link>
                {item.error ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Tentar carregar ${resource.label}`}
                    onClick={() => void loadResource(resource.key, resource.path)}
                  >
                    <RefreshCw size={14} aria-hidden />
                  </Button>
                ) : null}
              </CardHeader>
              <Link href={resource.href} className="block">
                <CardContent>
                  <p
                    className={`font-display text-5xl tracking-wide ${
                      item.error ? "text-red-600" : "text-neutral-900"
                    }`}
                    aria-live="polite"
                  >
                    {item.loading ? "—" : item.error ? "!" : item.value ?? "—"}
                  </p>
                  {item.error ? (
                    <p className="mt-2 text-xs text-red-600" role="alert">
                      {item.error}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-neutral-500">Ver detalhes</p>
                  )}
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
