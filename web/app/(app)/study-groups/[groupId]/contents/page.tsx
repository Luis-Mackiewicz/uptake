import { redirect } from "next/navigation";
import { GroupContentsPage } from "@/components/contents/group-contents-page";

export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const id = Number(groupId);

  if (!Number.isInteger(id) || id <= 0) redirect("/study-groups");

  return <GroupContentsPage groupId={id} />;
}
