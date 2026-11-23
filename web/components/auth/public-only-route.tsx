"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace("/dashboard");
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Carregando...</div>;
  }

  if (isAuthenticated) return null;

  return <>{children}</>;
}
