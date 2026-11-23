import { prisma } from "../../lib/prisma.js";
import type { Pagination } from "../../shared/domain.js";
import type { ContentLookup } from "../../shared/ownership.js";

export const contentSafeSelect = {
  id: true,
  title: true,
  description: true,
  studyGroupId: true,
  position: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface ContentInput {
  title: string;
  description?: string | null;
  studyGroupId: number;
  position?: number;
}

export const contentRepository = {
  async findById(id: number, userId: number) {
    return prisma.content.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
        studyGroup: { deletedAt: null },
      },
      select: contentSafeSelect,
    });
  },

  async findMany(userId: number, pagination: Pagination, studyGroupId?: number) {
    const where = {
      userId,
      deletedAt: null,
      studyGroup: { deletedAt: null },
      ...(studyGroupId === undefined ? {} : { studyGroupId }),
    };
    const [data, total] = await prisma.$transaction([
      prisma.content.findMany({
        where,
        select: contentSafeSelect,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: [{ position: "asc" }, { id: "asc" }],
      }),
      prisma.content.count({ where }),
    ]);
    return { data, total };
  },

  async countActiveLinks(userId: number, contentId: number) {
    const [notes, exams, cycles] = await prisma.$transaction([
      prisma.note.count({
        where: {
          userId,
          contentId,
          deletedAt: null,
          content: {
            deletedAt: null,
            studyGroup: { deletedAt: null },
          },
        },
      }),
      prisma.examContent.count({
        where: {
          contentId,
          exam: { userId, deletedAt: null },
        },
      }),
      prisma.studyCycleContent.count({
        where: {
          contentId,
          cycle: {
            userId,
            deletedAt: null,
            exam: { deletedAt: null },
          },
        },
      }),
    ]);

    return { notes, exams, cycles };
  },

  async findActiveIds(userId: number, studyGroupId: number) {
    const records = await prisma.content.findMany({
      where: {
        userId,
        studyGroupId,
        deletedAt: null,
        studyGroup: { deletedAt: null },
      },
      select: { id: true },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
    return records.map((record) => record.id);
  },

  async findNextPosition(userId: number, studyGroupId: number) {
    const last = await prisma.content.findFirst({
      where: {
        userId,
        studyGroupId,
        deletedAt: null,
        studyGroup: { deletedAt: null },
      },
      select: { position: true },
      orderBy: { position: "desc" },
    });
    return (last?.position ?? 0) + 1;
  },

  async reorder(userId: number, studyGroupId: number, ids: number[]) {
    await prisma.$transaction([
      ...ids.map((id, index) =>
        prisma.content.updateMany({
          where: { id, userId, studyGroupId, deletedAt: null },
          data: { position: -(index + 1) },
        }),
      ),
      ...ids.map((id, index) =>
        prisma.content.updateMany({
          where: { id, userId, studyGroupId, deletedAt: null },
          data: { position: index + 1 },
        }),
      ),
    ]);
  },

  async normalizePositions(userId: number, studyGroupId: number) {
    const ids = await this.findActiveIds(userId, studyGroupId);
    await this.reorder(userId, studyGroupId, ids);
  },

  async create(userId: number, data: ContentInput) {
    return prisma.content.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        studyGroupId: data.studyGroupId,
        position: data.position ?? (await this.findNextPosition(userId, data.studyGroupId)),
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
        position: data.position,
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
