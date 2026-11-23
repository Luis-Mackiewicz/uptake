import { prisma } from "../lib/prisma.js";
import type { Pagination } from "../schemas/pagination.schemas.js";

export const noteSafeSelect = {
  id: true,
  title: true,
  fileName: true,
  markdownContent: true,
  mimeType: true,
  sizeBytes: true,
  contentId: true,
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
}

export const noteRepository = {
  async findById(id: number, userId: number) {
    return prisma.note.findFirst({
      where: { id, userId, deletedAt: null },
      select: noteSafeSelect,
    });
  },

  async findByFileName(contentId: number, fileName: string, excludeId?: number) {
    return prisma.note.findFirst({
      where: {
        contentId,
        fileName,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, deletedAt: true },
    });
  },

  async findMany(userId: number, pagination: Pagination) {
    const where = { userId, deletedAt: null };
    const [data, total] = await prisma.$transaction([
      prisma.note.findMany({
        where,
        select: noteSafeSelect,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.note.count({ where }),
    ]);
    return { data, total };
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
        userId,
      },
      select: noteSafeSelect,
    });
  },

  async reactivate(id: number, data: NoteInput) {
    return prisma.note.update({
      where: { id },
      data: {
        title: data.title,
        fileName: data.fileName,
        markdownContent: data.markdownContent,
        mimeType: data.mimeType ?? "text/markdown",
        sizeBytes: data.sizeBytes ?? 0,
        contentId: data.contentId,
        deletedAt: null,
      },
      select: noteSafeSelect,
    });
  },

  async update(id: number, data: NoteInput) {
    return prisma.note.update({
      where: { id },
      data: {
        title: data.title,
        fileName: data.fileName,
        markdownContent: data.markdownContent,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        contentId: data.contentId,
      },
      select: noteSafeSelect,
    });
  },

  async softDelete(id: number) {
    return prisma.note.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: noteSafeSelect,
    });
  },
};
