"use client";

import type { CSSProperties } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { CyclePriority, StudyCycle, StudyGroup } from "@/lib/api/types";
import { CYCLE_PRIORITIES } from "@/lib/api/types";

const priorityAccent: Record<CyclePriority, string> = {
  1: "bg-lime-500",
  2: "bg-lime-300",
  3: "bg-neutral-400",
};

interface ExamKanbanProps {
  cycles: StudyCycle[];
  groups: StudyGroup[];
  saving: boolean;
  onEdit: (cycle: StudyCycle) => void;
  onDelete: (cycle: StudyCycle) => void;
  onAdvance: (cycle: StudyCycle) => void;
  onReorder: (priority: CyclePriority, ids: number[]) => void;
  onMove: (cycle: StudyCycle, priority: CyclePriority) => void;
}

function CycleCard({
  cycle,
  groupLabel,
  saving,
  onEdit,
  onDelete,
  onAdvance,
}: Pick<ExamKanbanProps, "saving" | "onEdit" | "onDelete" | "onAdvance"> & {
  cycle: StudyCycle;
  groupLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cycle.id,
    disabled: saving,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-neutral-200 bg-white p-3 shadow-sm",
        isDragging && "ring-2 ring-lime-300",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab text-neutral-400 hover:text-neutral-700"
          aria-label={`Arrastar ${cycle.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">{cycle.name}</p>
          <p className="mt-0.5 truncate text-xs text-neutral-500">{groupLabel}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <Badge tone="lime">{cycle.contentIds.length} conteúdos</Badge>
            {!cycle.active ? <Badge tone="neutral">Pausado</Badge> : null}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2">
        <span className="text-[11px] text-neutral-500">Rodada {cycle.currentRound}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition hover:bg-lime-50 hover:text-lime-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600 disabled:opacity-50"
            aria-label={`Avançar ${cycle.name}`}
            title="Avançar"
            onClick={() => onAdvance(cycle)}
            disabled={saving}
          >
            <Play size={14} aria-hidden />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600 disabled:opacity-50"
            aria-label={`Editar ${cycle.name}`}
            title="Editar"
            onClick={() => onEdit(cycle)}
            disabled={saving}
          >
            <Pencil size={14} aria-hidden />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
            aria-label={`Excluir ${cycle.name}`}
            title="Excluir"
            onClick={() => onDelete(cycle)}
            disabled={saving}
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  priority,
  label,
  cycles,
  groups,
  saving,
  onEdit,
  onDelete,
  onAdvance,
}: {
  priority: CyclePriority;
  label: string;
  cycles: StudyCycle[];
  groups: StudyGroup[];
} & Pick<ExamKanbanProps, "saving" | "onEdit" | "onDelete" | "onAdvance">) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${priority}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-64 flex-col rounded-xl border p-3 transition",
        isOver ? "border-lime-500 bg-lime-50" : "border-neutral-200 bg-neutral-50/80",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("h-6 w-1 shrink-0 rounded-full", priorityAccent[priority])} />
          <h3 className="truncate font-display text-lg tracking-wide text-neutral-800">{label}</h3>
        </div>
        <Badge tone={priority === 1 ? "lime" : "neutral"}>{cycles.length}</Badge>
      </div>
      <SortableContext items={cycles.map((cycle) => cycle.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2">
          {cycles.length ? (
            cycles.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                groupLabel={groups.find((group) => group.id === cycle.studyGroupId)?.name ?? "Sem grupo"}
                saving={saving}
                onEdit={onEdit}
                onDelete={onDelete}
                onAdvance={onAdvance}
              />
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-xs leading-5 text-neutral-500">
              Solte um ciclo aqui ou crie um novo ciclo.
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function ExamKanban({
  cycles,
  groups,
  saving,
  onEdit,
  onDelete,
  onAdvance,
  onReorder,
  onMove,
}: ExamKanbanProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const activeId = Number(active.id);
    const activeCycle = cycles.find((cycle) => cycle.id === activeId);
    if (!activeCycle) return;

    let targetPriority = activeCycle.priority;
    let targetId: number | null = null;

    if (typeof over.id === "string" && over.id.startsWith("column-")) {
      targetPriority = Number(over.id.replace("column-", "")) as CyclePriority;
    } else {
      const overCycle = cycles.find((cycle) => cycle.id === Number(over.id));
      if (!overCycle) return;
      targetPriority = overCycle.priority;
      targetId = overCycle.id;
    }

    if (targetPriority !== activeCycle.priority) {
      onMove(activeCycle, targetPriority);
      return;
    }

    const ids = cycles.filter((cycle) => cycle.priority === targetPriority).map((cycle) => cycle.id);
    const from = ids.indexOf(activeId);
    const to = targetId === null ? ids.length - 1 : ids.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    onReorder(targetPriority, arrayMove(ids, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 lg:grid-cols-3">
        {CYCLE_PRIORITIES.map((priority) => (
          <KanbanColumn
            key={priority.value}
            priority={priority.value}
            label={priority.label}
            cycles={cycles.filter((cycle) => cycle.priority === priority.value)}
            groups={groups}
            saving={saving}
            onEdit={onEdit}
            onDelete={onDelete}
            onAdvance={onAdvance}
          />
        ))}
      </div>
    </DndContext>
  );
}
