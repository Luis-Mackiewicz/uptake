"use client";

import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import { ContentActionsMenu } from "./content-actions-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { useSortableItem } from "@/components/ui/sortable";
import type { Content } from "@/lib/api/types";

interface ContentRowProps {
  content: Content;
  onEdit: (content: Content) => void;
  onDelete: (content: Content) => void;
}

export function ContentRow({ content, onEdit, onDelete }: ContentRowProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, style } = useSortableItem(content.id);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="cursor-pointer"
      onClick={() => router.push(`/study-groups/${content.studyGroupId}/contents/${content.id}`)}
    >
      <TableCell className="w-10 px-2">
        <button
          type="button"
          aria-label={`Arrastar ${content.title}`}
          className="flex h-8 w-6 cursor-grab touch-none items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical size={16} aria-hidden />
        </button>
      </TableCell>
      <TableCell className="font-medium">{content.title}</TableCell>
      <TableCell className="max-w-xs truncate text-neutral-600">
        {content.description ?? "—"}
      </TableCell>
      <TableCell className="text-right">
        <ContentActionsMenu content={content} onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}
