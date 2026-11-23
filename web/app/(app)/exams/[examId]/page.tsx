import { redirect } from "next/navigation";
import { ExamCyclesPage } from "@/components/exams/exam-cycles-page";

export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const id = Number(examId);

  if (!Number.isInteger(id) || id <= 0) redirect("/exams");

  return <ExamCyclesPage examId={id} />;
}
