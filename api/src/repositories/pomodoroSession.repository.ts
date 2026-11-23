import { prisma } from "../lib/prisma.js";
import type { Pagination } from "../schemas/pagination.schemas.js";

export const pomodoroSessionSafeSelect = {
  id: true,
  userId: true,
  contentId: true,
  focusMinutes: true,
  breakMinutes: true,
  startedAt: true,
  finishedAt: true,
  completed: true,
  createdAt: true,
} as const;

export interface CreatePomodoroInput {
  contentId?: number | null;
  focusMinutes: number;
  breakMinutes: number;
}

export const pomodoroSessionRepository = {
  async findById(id: number, userId: number) {
    return prisma.pomodoroSession.findFirst({
      where: { id, userId, deletedAt: null },
      select: pomodoroSessionSafeSelect,
    });
  },

  async findMany(userId: number, pagination: Pagination) {
    const where = { userId, deletedAt: null };
    const [data, total] = await prisma.$transaction([
      prisma.pomodoroSession.findMany({
        where,
        select: pomodoroSessionSafeSelect,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { startedAt: "desc" },
      }),
      prisma.pomodoroSession.count({ where }),
    ]);
    return { data, total };
  },

  async create(userId: number, data: CreatePomodoroInput) {
    return prisma.pomodoroSession.create({
      data: {
        userId,
        contentId: data.contentId ?? null,
        focusMinutes: data.focusMinutes,
        breakMinutes: data.breakMinutes,
      },
      select: pomodoroSessionSafeSelect,
    });
  },

  async finish(id: number) {
    return prisma.pomodoroSession.update({
      where: { id },
      data: { finishedAt: new Date(), completed: true },
      select: pomodoroSessionSafeSelect,
    });
  },

  async softDelete(id: number) {
    return prisma.pomodoroSession.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: pomodoroSessionSafeSelect,
    });
  },
};
