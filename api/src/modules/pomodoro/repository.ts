import { prisma } from "../../lib/prisma.js";
import type { Pagination } from "../../shared/domain.js";

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

function activeSessionWhere(userId: number) {
  return {
    userId,
    deletedAt: null,
    OR: [
      { contentId: null },
      {
        content: {
          deletedAt: null,
          studyGroup: { deletedAt: null },
        },
      },
    ],
  };
}

export const pomodoroSessionRepository = {
  async findById(id: number, userId: number) {
    return prisma.pomodoroSession.findFirst({
      where: { id, ...activeSessionWhere(userId) },
      select: pomodoroSessionSafeSelect,
    });
  },

  async findMany(userId: number, pagination: Pagination) {
    const where = activeSessionWhere(userId);
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

  async update(
    id: number,
    userId: number,
    data: CreatePomodoroInput,
  ) {
    return prisma.pomodoroSession.update({
      where: { id, userId, deletedAt: null },
      data: {
        contentId: data.contentId ?? null,
        focusMinutes: data.focusMinutes,
        breakMinutes: data.breakMinutes,
      },
      select: pomodoroSessionSafeSelect,
    });
  },

  async finish(id: number, userId: number) {
    return prisma.pomodoroSession.update({
      where: { id, userId, deletedAt: null },
      data: { finishedAt: new Date(), completed: true },
      select: pomodoroSessionSafeSelect,
    });
  },

  async softDelete(id: number, userId: number) {
    return prisma.pomodoroSession.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: pomodoroSessionSafeSelect,
    });
  },
};
