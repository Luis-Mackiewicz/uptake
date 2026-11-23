"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiRequestError } from "@/lib/api/client";
import type { Content, CreateExamRequest, Exam, Note, StudyGroup } from "@/lib/api/types";
import { isBlank, isValidDate, isValidPositiveId, validateLength } from "@/lib/validation";

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

type ExamForm = {
  title: string;
  description: string;
  examDate: string;
  location: string;
  studyGroupId: string;
  contentIds: string[];
  noteIds: string[];
};

type FormErrors = Partial<Record<keyof ExamForm, string>>;

function buildForm(exam: Exam | null): ExamForm {
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
  const [form, setForm] = useState<ExamForm>(() => buildForm(exam));
  const [errors, setErrors] = useState<FormErrors>({});

  const selectedGroupId = form.studyGroupId ? Number(form.studyGroupId) : null;
  const groupContents = contents.filter((content) => content.studyGroupId === selectedGroupId);
  const selectedContentIds = form.contentIds.map(Number);
  const availableNotes = notes.filter((note) => selectedContentIds.includes(note.contentId));

  const toggleContent = (id: number) => {
    const value = String(id);
    setForm((current) => {
      const selected = current.contentIds.includes(value);
      const contentIds = selected
        ? current.contentIds.filter((item) => item !== value)
        : [...current.contentIds, value];
      const allowedContentIds = contentIds.map(Number);
      return {
        ...current,
        contentIds,
        noteIds: current.noteIds.filter((noteId) => {
          const note = notes.find((item) => String(item.id) === noteId);
          return note ? allowedContentIds.includes(note.contentId) : false;
        }),
      };
    });
  };

  const toggleNote = (id: string) => {
    setForm((current) => ({
      ...current,
      noteIds: current.noteIds.includes(id)
        ? current.noteIds.filter((item) => item !== id)
        : [...current.noteIds, id],
    }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (isBlank(form.title)) nextErrors.title = "Informe o título";
    else if (!validateLength(form.title, 200)) nextErrors.title = "Máximo de 200 caracteres";
    if (!validateLength(form.description, 500)) nextErrors.description = "Máximo de 500 caracteres";
    if (!isValidDate(form.examDate)) nextErrors.examDate = "Informe uma data válida";
    if (!validateLength(form.location, 255)) nextErrors.location = "Máximo de 255 caracteres";
    if (form.studyGroupId && !isValidPositiveId(Number(form.studyGroupId))) {
      nextErrors.studyGroupId = "Grupo inválido";
    }
    if (form.contentIds.length > 50) nextErrors.contentIds = "Máximo de 50 conteúdos";
    if (form.noteIds.length > 50) nextErrors.noteIds = "Máximo de 50 notas";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: CreateExamRequest = {
      title: form.title.trim(),
      description: isBlank(form.description) ? null : form.description.trim(),
      examDate: form.examDate,
      location: isBlank(form.location) ? null : form.location.trim(),
      studyGroupId: selectedGroupId,
      contentIds: form.contentIds.map(Number),
      noteIds: form.noteIds.map(Number),
    };

    try {
      await onSave(payload);
    } catch (error) {
      if (error instanceof ApiRequestError && error.issues) {
        const apiErrors: FormErrors = {};
        Object.entries(error.issues).forEach(([key, messages]) => {
          if (key in form) apiErrors[key as keyof FormErrors] = messages[0];
        });
        setErrors(apiErrors);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={exam ? "Editar prova" : "Nova prova"} className="max-w-3xl">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título" htmlFor="exam-title" error={errors.title}>
            <Input id="exam-title" value={form.title} invalid={Boolean(errors.title)} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </Field>
          <Field label="Data" htmlFor="exam-date" error={errors.examDate}>
            <Input id="exam-date" type="date" value={form.examDate} invalid={Boolean(errors.examDate)} onChange={(event) => setForm({ ...form, examDate: event.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Grupo" htmlFor="exam-group" error={errors.studyGroupId}>
            <Select
              id="exam-group"
              value={form.studyGroupId}
              invalid={Boolean(errors.studyGroupId)}
              onChange={(event) => setForm({ ...form, studyGroupId: event.target.value, contentIds: [], noteIds: [] })}
            >
              <option value="">Sem grupo</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Local" htmlFor="exam-location" error={errors.location}>
            <Input id="exam-location" value={form.location} invalid={Boolean(errors.location)} onChange={(event) => setForm({ ...form, location: event.target.value })} />
          </Field>
        </div>
        <Field label="Descrição" htmlFor="exam-description" error={errors.description}>
          <Textarea id="exam-description" value={form.description} invalid={Boolean(errors.description)} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </Field>
        <Field label="Conteúdos vinculados" htmlFor="exam-contents" error={errors.contentIds} hint="Selecione um grupo para ver seus conteúdos.">
          <div id="exam-contents" className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-neutral-200 bg-white p-3">
            {groupContents.length ? groupContents.map((content) => (
              <label key={content.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-neutral-50">
                <input type="checkbox" className="size-4 accent-lime-600" checked={form.contentIds.includes(String(content.id))} onChange={() => toggleContent(content.id)} />
                <span>{content.title}</span>
              </label>
            )) : <p className="text-sm text-neutral-500">Selecione um grupo com conteúdos.</p>}
          </div>
        </Field>
        <Field label="Notas vinculadas" htmlFor="exam-notes" error={errors.noteIds} hint="Notas dos conteúdos selecionados.">
          <div id="exam-notes" className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-neutral-200 bg-white p-3">
            {availableNotes.length ? availableNotes.map((note) => (
              <label key={note.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-neutral-50">
                <input type="checkbox" className="size-4 accent-lime-600" checked={form.noteIds.includes(String(note.id))} onChange={() => toggleNote(String(note.id))} />
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
