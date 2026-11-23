import { prisma } from "../lib/prisma.js";
import type { Pagination } from "../schemas/pagination.schemas.js";
import type { ReviewInterval } from "../schemas/review.schemas.js";

export const reviewSafeSelect = {
  id: true,
  userId: true,
  noteId: true,
  lastReviewedAt: true,
  nextReviewAt: true,
  intervalDays: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface ReviewInput {
  noteId: number;
  nextReviewAt: Date;
  intervalDays: ReviewInterval;
}

export interface ReviewUpdateInput {
  nextReviewAt?: Date;
  intervalDays?: ReviewInterval;
}

export interface ReviewCompleteInput {
  lastReviewedAt: Date;
  nextReviewAt: Date;
  intervalDays: ReviewInterval;
  reviewCount: number;
}

export const reviewRepository = {
  async findById(id: number, userId: number) {
    return prisma.review.findFirst({
      where: { id, userId, deletedAt: null },
      select: reviewSafeSelect,
    });
  },

  async findByNote(noteId: number, userId: number) {
    return prisma.review.findFirst({
      where: { noteId, userId },
      select: { ...reviewSafeSelect, deletedAt: true },
    });
  },

  async findMany(userId: number, pagination: Pagination, due: boolean) {
    const where = {
      userId,
      deletedAt: null,
      ...(due ? { nextReviewAt: { lte: new Date() } } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        select: reviewSafeSelect,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { nextReviewAt: "asc" },
      }),
      prisma.review.count({ where }),
    ]);
    return { data, total };
  },

  async create(userId: number, data: ReviewInput) {
    return prisma.review.create({
      data: { ...data, userId },
      select: reviewSafeSelect,
    });
  },

  async reactivate(id: number, data: ReviewInput) {
    return prisma.review.update({
      where: { id },
      data: {
        noteId: data.noteId,
        nextReviewAt: data.nextReviewAt,
        intervalDays: data.intervalDays,
        lastReviewedAt: null,
        reviewCount: 0,
        deletedAt: null,
      },
      select: reviewSafeSelect,
    });
  },

  async update(id: number, data: ReviewUpdateInput) {
    return prisma.review.update({
      where: { id },
      data,
      select: reviewSafeSelect,
    });
  },

  async complete(id: number, data: ReviewCompleteInput) {
    return prisma.review.update({
      where: { id },
      data,
      select: reviewSafeSelect,
    });
  },

  async softDelete(id: number) {
    return prisma.review.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: reviewSafeSelect,
    });
  },
};
