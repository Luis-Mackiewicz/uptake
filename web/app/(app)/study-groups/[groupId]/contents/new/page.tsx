import { redirect } from "next/navigation";
import { ContentNewPage } from "@/components/contents/content-form";

export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const id = Number(groupId);

  if (!Number.isInteger(id) || id <= 0) redirect("/study-groups");

  return <ContentNewPage groupId={id} />;
}
