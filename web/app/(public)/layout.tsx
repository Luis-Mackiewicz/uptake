import type { ReactNode } from "react";
import Link from "next/link";
import { PublicOnlyRoute } from "@/components/auth/public-only-route";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <PublicOnlyRoute>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
            <Link href="/" className="font-display text-2xl tracking-widest text-neutral-900">
              UPTAKE
            </Link>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center p-6">{children}</main>
      </div>
    </PublicOnlyRoute>
  );
}
