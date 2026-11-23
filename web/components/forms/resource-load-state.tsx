import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ResourceLoadStateProps {
  loading: boolean;
  error: string | null;
  backHref: string;
  notFoundLabel?: string;
}

export function ResourceLoadState({
  loading,
  error,
  backHref,
  notFoundLabel = "Item não encontrado",
}: ResourceLoadStateProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-neutral-600">Carregando...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <p className="text-sm text-red-700" role="alert">
        {error ?? notFoundLabel}
      </p>
      <Link href={backHref} className="mt-4 inline-block">
        <Button variant="secondary">
          <ArrowLeft size={16} aria-hidden />
          Voltar
        </Button>
      </Link>
    </Card>
  );
}
