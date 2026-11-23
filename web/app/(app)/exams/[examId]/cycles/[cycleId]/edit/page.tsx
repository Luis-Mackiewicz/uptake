import { redirect } from "next/navigation";
import { CycleEditPage } from "@/components/exams/cycle-form";

export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ examId: string; cycleId: string }>;
}) {
  const { examId, cycleId } = await params;
  const exam = Number(examId);
  const cycle = Number(cycleId);

  if (!Number.isInteger(exam) || exam <= 0 || !Number.isInteger(cycle) || cycle <= 0) {
    redirect("/exams");
  }

  return <CycleEditPage examId={exam} cycleId={cycle} />;
}
