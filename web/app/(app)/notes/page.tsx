import { Suspense } from "react";
import { NotesPageContent } from "@/components/notes/notes-page";

export const instant = false;

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Carregando notas...</div>}>
      <NotesPageContent />
    </Suspense>
  );
}
