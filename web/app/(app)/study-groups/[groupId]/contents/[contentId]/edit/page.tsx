import { redirect } from "next/navigation";
import { ContentEditPage } from "@/components/contents/content-form";

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

  return <ContentEditPage groupId={group} contentId={content} />;
}
