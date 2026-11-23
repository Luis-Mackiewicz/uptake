"use client";

import type { FormEventHandler, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { BreadcrumbItem } from "@/components/layout/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface ResourceFormPageProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  backHref: string;
  backLabel?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitting?: boolean;
  submitLabel?: string;
  error?: string | null;
  wide?: boolean;
  children: ReactNode;
}

export function ResourceFormPage({
  title,
  description,
  breadcrumbs,
  backHref,
  backLabel = "Voltar",
  onSubmit,
  submitting = false,
  submitLabel = "Salvar",
  error,
  wide = false,
  children,
}: ResourceFormPageProps) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={
          <Link href={backHref}>
            <Button variant="secondary">
              <ArrowLeft size={16} aria-hidden />
              {backLabel}
            </Button>
          </Link>
        }
      />
      <Card className={cn("p-6", wide ? "max-w-4xl" : "max-w-2xl")}>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {children}
          <div className="flex justify-end gap-2 pt-2">
            <Link href={backHref}>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" loading={submitting}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
