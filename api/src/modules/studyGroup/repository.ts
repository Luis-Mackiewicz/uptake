import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../shared/errors.js";
import type { Pagination } from "../../shared/domain.js";
import type { StudyGroupLookup } from "../../shared/ownership.js";

export const studyGroupSafeSelect = {
  id: true,
  name: true,
  description: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface StudyGroupInput {
  name: string;
  description?: string | null;
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
        userId,
      },
      select: studyGroupSafeSelect,
    });
  },

  async reactivate(id: number, userId: number, data: StudyGroupInput) {
    const group = await prisma.studyGroup.findFirst({
      where: { id, userId },
      select: { deletedAt: true },
    });

    if (!group) {
      throw new NotFoundError("Grupo de estudo não encontrado");
    }

    const deletedAt = group.deletedAt ?? new Date();
    const contents = await prisma.content.findMany({
      where: { studyGroupId: id, userId },
      select: { id: true },
    });
    const contentIds = contents.map((content) => content.id);
    const [, , reactivated] = await prisma.$transaction([
      prisma.note.updateMany({
        where: { userId, contentId: { in: contentIds }, deletedAt },
        data: { deletedAt: null },
      }),
      prisma.content.updateMany({
        where: { userId, studyGroupId: id, deletedAt },
        data: { deletedAt: null },
      }),
      prisma.studyGroup.update({
        where: { id, userId },
        data: {
          name: data.name,
          description: data.description ?? null,
          deletedAt: null,
        },
        select: studyGroupSafeSelect,
      }),
    ]);

    return reactivated;
  },

  async update(id: number, userId: number, data: StudyGroupInput) {
    return prisma.studyGroup.update({
      where: { id, userId, deletedAt: null },
      data: {
        name: data.name,
        description: data.description,
      },
      select: studyGroupSafeSelect,
    });
  },

  async softDelete(id: number, userId: number) {
    const deletedAt = new Date();
    const contents = await prisma.content.findMany({
      where: { studyGroupId: id, userId, deletedAt: null },
      select: { id: true },
    });
    const contentIds = contents.map((content) => content.id);
    const [, , deleted] = await prisma.$transaction([
      prisma.note.updateMany({
        where: { userId, contentId: { in: contentIds }, deletedAt: null },
        data: { deletedAt },
      }),
      prisma.content.updateMany({
        where: { studyGroupId: id, userId, deletedAt: null },
        data: { deletedAt },
      }),
      prisma.studyGroup.update({
        where: { id, userId, deletedAt: null },
        data: { deletedAt },
        select: studyGroupSafeSelect,
      }),
    ]);

    return deleted;
  },
};

export const studyGroupLookup: StudyGroupLookup = {
  findById: (id, userId) => studyGroupRepository.findById(id, userId),
};
