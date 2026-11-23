import { redirect } from "next/navigation";
import { CycleForm } from "@/components/exams/cycle-form";

export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const id = Number(examId);

  if (!Number.isInteger(id) || id <= 0) redirect("/exams");

  return <CycleForm examId={id} />;
}
