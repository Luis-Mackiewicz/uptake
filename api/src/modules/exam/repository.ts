import { prisma } from "../../lib/prisma.js";
import type { Pagination } from "../../shared/domain.js";

export const examSafeSelect = {
  id: true,
  title: true,
  description: true,
  examDate: true,
  location: true,
  studyGroupId: true,
  googleEventId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  notes: {
    select: { noteId: true },
  },
  contents: {
    select: { contentId: true },
  },
} as const;

type ExamWithNotes = {
  id: number;
  title: string;
  description: string | null;
  examDate: Date;
  location: string | null;
  studyGroupId: number | null;
  googleEventId: string | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  notes: { noteId: number }[];
  contents: { contentId: number }[];
};

export type SafeExam = Omit<ExamWithNotes, "notes" | "contents"> & {
  noteIds: number[];
  contentIds: number[];
};

function toSafeExam(record: ExamWithNotes): SafeExam {
  const { notes, contents, ...exam } = record;
  return {
    ...exam,
    noteIds: notes.map((item) => item.noteId),
    contentIds: contents.map((item) => item.contentId),
  };
}

export interface ExamInput {
  title: string;
  description?: string | null;
  examDate: Date;
  location?: string | null;
  studyGroupId?: number | null;
  contentIds: number[];
  noteIds: number[];
}

function activeExamWhere(userId: number) {
  return {
    userId,
    deletedAt: null,
    OR: [
      { studyGroupId: null },
      { studyGroup: { deletedAt: null } },
    ],
    contents: {
      every: {
        content: {
          deletedAt: null,
          studyGroup: { deletedAt: null },
        },
      },
    },
    notes: {
      every: {
        note: {
          deletedAt: null,
          content: {
            deletedAt: null,
            studyGroup: { deletedAt: null },
          },
        },
      },
    },
  };
}

export const examRepository = {
  async findById(id: number, userId: number) {
    const exam = await prisma.exam.findFirst({
      where: { id, ...activeExamWhere(userId) },
      select: examSafeSelect,
    });
    return exam ? toSafeExam(exam) : null;
  },

  async findMany(userId: number, pagination: Pagination) {
    const where = activeExamWhere(userId);
    const [data, total] = await prisma.$transaction([
      prisma.exam.findMany({
        where,
        select: examSafeSelect,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { examDate: "asc" },
      }),
      prisma.exam.count({ where }),
    ]);
    return { data: data.map(toSafeExam), total };
  },

  async create(userId: number, data: ExamInput) {
    const exam = await prisma.exam.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        examDate: data.examDate,
        location: data.location ?? null,
        studyGroupId: data.studyGroupId ?? null,
        userId,
        contents: {
          create: data.contentIds.map((contentId) => ({
            content: { connect: { id: contentId } },
          })),
        },
        notes: {
          create: data.noteIds.map((noteId) => ({
            note: { connect: { id: noteId } },
          })),
        },
      },
      select: examSafeSelect,
    });
    return toSafeExam(exam);
  },

  async update(id: number, userId: number, data: ExamInput) {
    const exam = await prisma.exam.update({
      where: { id, userId, deletedAt: null },
      data: {
        title: data.title,
        description: data.description ?? null,
        examDate: data.examDate,
        location: data.location ?? null,
        studyGroupId: data.studyGroupId ?? null,
        contents: {
          deleteMany: {},
          create: data.contentIds.map((contentId) => ({
            content: { connect: { id: contentId } },
          })),
        },
        notes: {
          deleteMany: {},
          create: data.noteIds.map((noteId) => ({
            note: { connect: { id: noteId } },
          })),
        },
      },
      select: examSafeSelect,
    });
    return toSafeExam(exam);
  },

  async softDelete(id: number, userId: number) {
    const exam = await prisma.exam.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: examSafeSelect,
    });
    return toSafeExam(exam);
  },
};
