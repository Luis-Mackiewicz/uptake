"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyApiIssues, nullableTrimmed } from "@/lib/form";
import { examFormSchema } from "@/lib/schemas";
import type { ExamFormValues } from "@/lib/schemas";
import type { Content, CreateExamRequest, Exam, Note, StudyGroup } from "@/lib/api/types";

interface ExamFormDialogProps {
  open: boolean;
  exam: Exam | null;
  groups: StudyGroup[];
  contents: Content[];
  notes: Note[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: CreateExamRequest) => Promise<void>;
}

function buildForm(exam: Exam | null): ExamFormValues {
  return {
    title: exam?.title ?? "",
    description: exam?.description ?? "",
    examDate: exam ? exam.examDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    location: exam?.location ?? "",
    studyGroupId: exam?.studyGroupId ? String(exam.studyGroupId) : "",
    contentIds: (exam?.contentIds ?? []).map(String),
    noteIds: (exam?.noteIds ?? []).map(String),
  };
}

export function ExamFormDialog({
  open,
  exam,
  groups,
  contents,
  notes,
  saving,
  onClose,
  onSave,
}: ExamFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: buildForm(exam),
  });

  useEffect(() => {
    if (open) reset(buildForm(exam));
  }, [open, exam, reset]);

  const studyGroupId = useWatch({ control, name: "studyGroupId" });
  const contentIds = useWatch({ control, name: "contentIds" });
  const noteIds = useWatch({ control, name: "noteIds" });
  const selectedGroupId = studyGroupId ? Number(studyGroupId) : null;
  const groupContents = contents.filter((content) => content.studyGroupId === selectedGroupId);
  const selectedContentIds = contentIds.map(Number);
  const availableNotes = notes.filter((note) => selectedContentIds.includes(note.contentId));

  const toggleContent = (id: number) => {
    const value = String(id);
    const current = getValues("contentIds");
    const nextContentIds = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    const allowedContentIds = nextContentIds.map(Number);
    setValue("contentIds", nextContentIds, { shouldDirty: true, shouldValidate: true });
    setValue(
      "noteIds",
      getValues("noteIds").filter((noteId) => {
        const note = notes.find((item) => String(item.id) === noteId);
        return note ? allowedContentIds.includes(note.contentId) : false;
      }),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const toggleNote = (id: string) => {
    const current = getValues("noteIds");
    setValue(
      "noteIds",
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const onSubmit = async (values: ExamFormValues) => {
    const payload: CreateExamRequest = {
      title: values.title,
      description: nullableTrimmed(values.description),
      examDate: values.examDate,
      location: nullableTrimmed(values.location),
      studyGroupId: values.studyGroupId ? Number(values.studyGroupId) : null,
      contentIds: values.contentIds.map(Number),
      noteIds: values.noteIds.map(Number),
    };

    try {
      await onSave(payload);
    } catch (error) {
      applyApiIssues(error, setError);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={exam ? "Editar prova" : "Nova prova"} className="max-w-3xl">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título" htmlFor="exam-title" error={errors.title?.message}>
            <Input id="exam-title" invalid={Boolean(errors.title)} {...register("title")} />
          </Field>
          <Field label="Data" htmlFor="exam-date" error={errors.examDate?.message}>
            <Input id="exam-date" type="date" invalid={Boolean(errors.examDate)} {...register("examDate")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Grupo" htmlFor="exam-group" error={errors.studyGroupId?.message}>
            <Select
              id="exam-group"
              invalid={Boolean(errors.studyGroupId)}
              {...register("studyGroupId", {
                onChange: () => {
                  setValue("contentIds", [], { shouldDirty: true, shouldValidate: true });
                  setValue("noteIds", [], { shouldDirty: true, shouldValidate: true });
                },
              })}
            >
              <option value="">Sem grupo</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Local" htmlFor="exam-location" error={errors.location?.message}>
            <Input id="exam-location" invalid={Boolean(errors.location)} {...register("location")} />
          </Field>
        </div>
        <Field label="Descrição" htmlFor="exam-description" error={errors.description?.message}>
          <Textarea id="exam-description" invalid={Boolean(errors.description)} {...register("description")} />
        </Field>
        <Field label="Conteúdos vinculados" htmlFor="exam-contents" error={errors.contentIds?.message} hint="Selecione um grupo para ver seus conteúdos.">
          <div id="exam-contents" className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-neutral-200 bg-white p-3">
            {groupContents.length ? groupContents.map((content) => (
              <label key={content.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-neutral-50">
                <input type="checkbox" className="size-4 accent-lime-600" checked={contentIds.includes(String(content.id))} onChange={() => toggleContent(content.id)} />
                <span>{content.title}</span>
              </label>
            )) : <p className="text-sm text-neutral-500">Selecione um grupo com conteúdos.</p>}
          </div>
        </Field>
        <Field label="Notas vinculadas" htmlFor="exam-notes" error={errors.noteIds?.message} hint="Notas dos conteúdos selecionados.">
          <div id="exam-notes" className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-neutral-200 bg-white p-3">
            {availableNotes.length ? availableNotes.map((note) => (
              <label key={note.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-neutral-50">
                <input type="checkbox" className="size-4 accent-lime-600" checked={noteIds.includes(String(note.id))} onChange={() => toggleNote(String(note.id))} />
                <span>{note.title}</span>
              </label>
            )) : <p className="text-sm text-neutral-500">Selecione conteúdos para ver notas.</p>}
          </div>
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={saving}>Salvar</Button>
        </div>
      </form>
    </Dialog>
  );
}
