import { prisma } from "../../lib/prisma.js";
import type { Pagination } from "../../shared/domain.js";
import type { StudyGroupLookup } from "../../shared/ownership.js";

export const studyGroupSafeSelect = {
  id: true,
  name: true,
  description: true,
  color: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface StudyGroupInput {
  name: string;
  description?: string | null;
  color?: string | null;
}

export const studyGroupRepository = {
  async findById(id: number, userId: number) {
    return prisma.studyGroup.findFirst({
      where: { id, userId, deletedAt: null },
      select: studyGroupSafeSelect,
    });
  },

  async findByName(userId: number, name: string, excludeId?: number) {
    return prisma.studyGroup.findFirst({
      where: {
        userId,
        name,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, deletedAt: true },
    });
  },

  async findMany(userId: number, pagination: Pagination) {
    const where = { userId, deletedAt: null };
    const [data, total] = await prisma.$transaction([
      prisma.studyGroup.findMany({
        where,
        select: studyGroupSafeSelect,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.studyGroup.count({ where }),
    ]);
    return { data, total };
  },

  async create(userId: number, data: StudyGroupInput) {
    return prisma.studyGroup.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
        userId,
      },
      select: studyGroupSafeSelect,
    });
  },

  async reactivate(id: number, userId: number, data: StudyGroupInput) {
    return prisma.studyGroup.update({
      where: { id, userId },
      data: {
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
        deletedAt: null,
      },
      select: studyGroupSafeSelect,
    });
  },

  async update(id: number, userId: number, data: StudyGroupInput) {
    return prisma.studyGroup.update({
      where: { id, userId, deletedAt: null },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
      },
      select: studyGroupSafeSelect,
    });
  },

  async softDelete(id: number, userId: number) {
    return prisma.studyGroup.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: studyGroupSafeSelect,
    });
  },
};

export const studyGroupLookup: StudyGroupLookup = {
  findById: (id, userId) => studyGroupRepository.findById(id, userId),
};
