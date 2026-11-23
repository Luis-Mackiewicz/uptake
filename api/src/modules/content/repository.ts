import { prisma } from "../../lib/prisma.js";
import type { Pagination } from "../../shared/domain.js";
import type { ContentLookup } from "../../shared/ownership.js";

export const contentSafeSelect = {
  id: true,
  title: true,
  description: true,
  studyGroupId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface ContentInput {
  title: string;
  description?: string | null;
  studyGroupId: number;
}

export const contentRepository = {
  async findById(id: number, userId: number) {
    return prisma.content.findFirst({
      where: { id, userId, deletedAt: null },
      select: contentSafeSelect,
    });
  },

  async findMany(userId: number, pagination: Pagination) {
    const where = { userId, deletedAt: null };
    const [data, total] = await prisma.$transaction([
      prisma.content.findMany({
        where,
        select: contentSafeSelect,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.content.count({ where }),
    ]);
    return { data, total };
  },

  async create(userId: number, data: ContentInput) {
    return prisma.content.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        studyGroupId: data.studyGroupId,
        userId,
      },
      select: contentSafeSelect,
    });
  },

  async update(id: number, userId: number, data: ContentInput) {
    return prisma.content.update({
      where: { id, userId, deletedAt: null },
      data: {
        title: data.title,
        description: data.description,
        studyGroupId: data.studyGroupId,
      },
      select: contentSafeSelect,
    });
  },

  async softDelete(id: number, userId: number) {
    return prisma.content.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: contentSafeSelect,
    });
  },
};

export const contentLookup: ContentLookup = {
  findById: (id, userId) => contentRepository.findById(id, userId),
};
