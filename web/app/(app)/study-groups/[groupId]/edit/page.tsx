import { redirect } from "next/navigation";
import { StudyGroupEditPage } from "@/components/study-groups/study-group-form";

export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const id = Number(groupId);

  if (!Number.isInteger(id) || id <= 0) redirect("/study-groups");

  return <StudyGroupEditPage groupId={id} />;
}
