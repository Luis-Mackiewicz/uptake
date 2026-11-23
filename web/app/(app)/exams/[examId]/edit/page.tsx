import { redirect } from "next/navigation";
import { ExamEditPage } from "@/components/exams/exam-form";

export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const id = Number(examId);

  if (!Number.isInteger(id) || id <= 0) redirect("/exams");

  return <ExamEditPage examId={id} />;
}
