"use client";

import { ExamCard } from "@/components/exams/exam-card";
import { ExamRow } from "@/components/exams/exam-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ViewToggle } from "@/components/ui/view-toggle";
import type { ViewMode } from "@/hooks/use-view-mode";
import type { Exam, Page, StudyGroup } from "@/lib/api/types";

interface ExamListProps {
  data: Page<Exam> | null;
  view: ViewMode;
  groups: StudyGroup[];
  onViewChange: (view: ViewMode) => void;
  onPageChange: (page: number) => void;
  onCreate: () => void;
  onOpen: (exam: Exam) => void;
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function ExamList({
  data,
  view,
  groups,
  onViewChange,
  onPageChange,
  onCreate,
  onOpen,
  onEdit,
  onDelete,
}: ExamListProps) {
  const groupName = (id: number | null) =>
    id === null ? "Sem grupo" : groups.find((group) => group.id === id)?.name ?? `#${id}`;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <ViewToggle value={view} onChange={onViewChange} />
      </div>

      {data?.data.length ? (
        <>
          {view === "table" ? (
            <Card className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Conteúdos</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((exam) => (
                    <ExamRow
                      key={exam.id}
                      exam={exam}
                      groupLabel={groupName(exam.studyGroupId)}
                      dateLabel={formatDate(exam.examDate)}
                      contentLabel={String(exam.contentIds?.length ?? 0)}
                      onOpen={onOpen}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.data.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  groupLabel={groupName(exam.studyGroupId)}
                  dateLabel={formatDate(exam.examDate)}
                  contentLabel={`${exam.contentIds?.length ?? 0} ${exam.contentIds?.length === 1 ? "conteúdo" : "conteúdos"}`}
                  onOpen={onOpen}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
          <div className="mt-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={onPageChange} />
          </div>
        </>
      ) : (
        <Card>
          <EmptyState
            title={data ? "Nenhuma prova encontrada" : "Carregando..."}
            description="Cadastre uma prova para acompanhar seus preparativos."
            action={<Button onClick={onCreate}>Nova prova</Button>}
          />
        </Card>
      )}
    </div>
  );
}
