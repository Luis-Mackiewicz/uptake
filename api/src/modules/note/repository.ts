import { prisma } from "../../lib/prisma.js";
import type { Pagination } from "../../shared/domain.js";
import type { NoteLookup } from "../../shared/ownership.js";

export const noteSafeSelect = {
  id: true,
  title: true,
  fileName: true,
  markdownContent: true,
  mimeType: true,
  sizeBytes: true,
  contentId: true,
  position: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface NoteInput {
  title: string;
  fileName: string;
  markdownContent: string;
  mimeType?: string;
  sizeBytes?: number;
  contentId: number;
  position?: number;
}

export const noteRepository = {
  async findById(id: number, userId: number) {
    return prisma.note.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
        content: {
          deletedAt: null,
          studyGroup: { deletedAt: null },
        },
      },
      select: noteSafeSelect,
    });
  },

  async findByFileName(
    userId: number,
    contentId: number,
    fileName: string,
    excludeId?: number,
  ) {
    return prisma.note.findFirst({
      where: {
        userId,
        contentId,
        fileName,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, deletedAt: true },
    });
  },

  async findMany(userId: number, pagination: Pagination, contentId?: number) {
    const where = {
      userId,
      deletedAt: null,
      content: {
        deletedAt: null,
        studyGroup: { deletedAt: null },
      },
      ...(contentId === undefined ? {} : { contentId }),
    };
    const [data, total] = await prisma.$transaction([
      prisma.note.findMany({
        where,
        select: noteSafeSelect,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: [{ position: "asc" }, { id: "asc" }],
      }),
      prisma.note.count({ where }),
    ]);
    return { data, total };
  },

  async findActiveIds(userId: number, contentId: number) {
    const records = await prisma.note.findMany({
      where: {
        userId,
        contentId,
        deletedAt: null,
        content: {
          deletedAt: null,
          studyGroup: { deletedAt: null },
        },
      },
      select: { id: true },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
    return records.map((record) => record.id);
  },

  async findNextPosition(userId: number, contentId: number) {
    const last = await prisma.note.findFirst({
      where: {
        userId,
        contentId,
        deletedAt: null,
        content: {
          deletedAt: null,
          studyGroup: { deletedAt: null },
        },
      },
      select: { position: true },
      orderBy: { position: "desc" },
    });
    return (last?.position ?? 0) + 1;
  },

  async reorder(userId: number, contentId: number, ids: number[]) {
    await prisma.$transaction([
      ...ids.map((id, index) =>
        prisma.note.updateMany({
          where: { id, userId, contentId, deletedAt: null },
          data: { position: -(index + 1) },
        }),
      ),
      ...ids.map((id, index) =>
        prisma.note.updateMany({
          where: { id, userId, contentId, deletedAt: null },
          data: { position: index + 1 },
        }),
      ),
    ]);
  },

  async normalizePositions(userId: number, contentId: number) {
    const ids = await this.findActiveIds(userId, contentId);
    await this.reorder(userId, contentId, ids);
  },

  async create(userId: number, data: NoteInput) {
    return prisma.note.create({
      data: {
        title: data.title,
        fileName: data.fileName,
        markdownContent: data.markdownContent,
        mimeType: data.mimeType ?? "text/markdown",
        sizeBytes: data.sizeBytes ?? 0,
        contentId: data.contentId,
        position: data.position ?? (await this.findNextPosition(userId, data.contentId)),
        userId,
      },
      select: noteSafeSelect,
    });
  },

  async reactivate(id: number, userId: number, data: NoteInput) {
    return prisma.note.update({
      where: { id, userId },
      data: {
        title: data.title,
        fileName: data.fileName,
        markdownContent: data.markdownContent,
        mimeType: data.mimeType ?? "text/markdown",
        sizeBytes: data.sizeBytes ?? 0,
        contentId: data.contentId,
        position: data.position ?? (await this.findNextPosition(userId, data.contentId)),
        deletedAt: null,
      },
      select: noteSafeSelect,
    });
  },

  async update(id: number, userId: number, data: NoteInput) {
    return prisma.note.update({
      where: { id, userId, deletedAt: null },
      data: {
        title: data.title,
        fileName: data.fileName,
        markdownContent: data.markdownContent,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        contentId: data.contentId,
        position: data.position,
      },
      select: noteSafeSelect,
    });
  },

  async softDelete(id: number, userId: number) {
    return prisma.note.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: noteSafeSelect,
    });
  },
};

export const noteLookup: NoteLookup = {
  findById: (id, userId) => noteRepository.findById(id, userId),
};
