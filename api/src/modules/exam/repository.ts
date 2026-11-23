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
} as const;

export interface ExamInput {
  title: string;
  description?: string | null;
  examDate: Date;
  location?: string | null;
  studyGroupId?: number | null;
  noteIds: number[];
}

export const examRepository = {
  async findById(id: number, userId: number) {
    return prisma.exam.findFirst({
      where: { id, userId, deletedAt: null },
      select: examSafeSelect,
    });
  },

  async findMany(userId: number, pagination: Pagination) {
    const where = { userId, deletedAt: null };
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
    return { data, total };
  },

  async create(userId: number, data: ExamInput) {
    return prisma.exam.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        examDate: data.examDate,
        location: data.location ?? null,
        studyGroupId: data.studyGroupId ?? null,
        userId,
        notes: {
          create: data.noteIds.map((noteId) => ({
            note: { connect: { id: noteId } },
          })),
        },
      },
      select: examSafeSelect,
    });
  },

  async update(id: number, userId: number, data: ExamInput) {
    return prisma.exam.update({
      where: { id, userId, deletedAt: null },
      data: {
        title: data.title,
        description: data.description ?? null,
        examDate: data.examDate,
        location: data.location ?? null,
        studyGroupId: data.studyGroupId ?? null,
        notes: {
          deleteMany: {},
          create: data.noteIds.map((noteId) => ({
            note: { connect: { id: noteId } },
          })),
        },
      },
      select: examSafeSelect,
    });
  },

  async softDelete(id: number, userId: number) {
    return prisma.exam.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: examSafeSelect,
    });
  },
};
