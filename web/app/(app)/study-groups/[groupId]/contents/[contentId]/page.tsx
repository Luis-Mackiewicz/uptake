import { redirect } from "next/navigation";
import { ContentFolderPage } from "@/components/contents/content-folder-page";

export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ groupId: string; contentId: string }>;
}) {
  const { groupId, contentId } = await params;
  const group = Number(groupId);
  const content = Number(contentId);

  if (!Number.isInteger(group) || group <= 0 || !Number.isInteger(content) || content <= 0) {
    redirect("/study-groups");
  }

  return <ContentFolderPage groupId={group} contentId={content} />;
}
