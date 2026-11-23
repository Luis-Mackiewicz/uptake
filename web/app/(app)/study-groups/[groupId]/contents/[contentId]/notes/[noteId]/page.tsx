import { redirect } from "next/navigation";
import { NoteFilePage } from "@/components/notes/note-file-page";

export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ groupId: string; contentId: string; noteId: string }>;
}) {
  const { groupId, contentId, noteId } = await params;
  const group = Number(groupId);
  const content = Number(contentId);
  const note = Number(noteId);

  if (
    !Number.isInteger(group) ||
    group <= 0 ||
    !Number.isInteger(content) ||
    content <= 0 ||
    !Number.isInteger(note) ||
    note <= 0
  ) {
    redirect("/study-groups");
  }

  return <NoteFilePage groupId={group} contentId={content} noteId={note} />;
}
