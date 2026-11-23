import { prisma } from "../lib/prisma.js";
import type { Pagination } from "../schemas/pagination.schemas.js";

export const studyCycleSafeSelect = {
  id: true,
  name: true,
  active: true,
  currentRound: true,
  nextItemOrder: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface StudyCycleInput {
  name: string;
  active: boolean;
}

export const studyCycleRepository = {
  async findById(id: number, userId: number) {
    return prisma.studyCycle.findFirst({
      where: { id, userId, deletedAt: null },
      select: studyCycleSafeSelect,
    });
  },

  async findMany(userId: number, pagination: Pagination) {
    const where = { userId, deletedAt: null };
    const [data, total] = await prisma.$transaction([
      prisma.studyCycle.findMany({
        where,
        select: studyCycleSafeSelect,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.studyCycle.count({ where }),
    ]);
    return { data, total };
  },

  async create(userId: number, data: StudyCycleInput) {
    return prisma.studyCycle.create({
      data: { ...data, userId },
      select: studyCycleSafeSelect,
    });
  },

  async update(id: number, data: StudyCycleInput) {
    return prisma.studyCycle.update({
      where: { id },
      data,
      select: studyCycleSafeSelect,
    });
  },

  async softDelete(id: number) {
    return prisma.studyCycle.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: studyCycleSafeSelect,
    });
  },
};
