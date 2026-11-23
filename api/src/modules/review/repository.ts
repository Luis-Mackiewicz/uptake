import { prisma } from "../../lib/prisma.js";
import type { Pagination, ReviewInterval } from "../../shared/domain.js";
import type { CreateReviewData } from "./schemas.js";

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

function toReviewInput(data: CreateReviewData): ReviewInput {
  return {
    noteId: data.noteId,
    nextReviewAt: data.nextReviewAt ?? new Date(),
    intervalDays: data.intervalDays ?? 1,
  };
}

function activeReviewWhere(userId: number, due = false) {
  return {
    userId,
    deletedAt: null,
    note: {
      deletedAt: null,
      content: {
        deletedAt: null,
        studyGroup: { deletedAt: null },
      },
    },
    ...(due ? { nextReviewAt: { lte: new Date() } } : {}),
  };
}

export const reviewRepository = {
  async findById(id: number, userId: number) {
    return prisma.review.findFirst({
      where: { id, ...activeReviewWhere(userId) },
      select: reviewSafeSelect,
    });
  },

  async findByNote(noteId: number, userId: number) {
    return prisma.review.findFirst({
      where: { noteId, userId },
      select: { ...reviewSafeSelect, deletedAt: true },
    });
  },

  async findMany(userId: number, pagination: Pagination, due = false) {
    const where = activeReviewWhere(userId, due);
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

  async create(userId: number, data: CreateReviewData) {
    return prisma.review.create({
      data: { ...toReviewInput(data), userId },
      select: reviewSafeSelect,
    });
  },

  async reactivate(id: number, userId: number, data: CreateReviewData) {
    const input = toReviewInput(data);

    return prisma.review.update({
      where: { id, userId },
      data: {
        noteId: input.noteId,
        nextReviewAt: input.nextReviewAt,
        intervalDays: input.intervalDays,
        lastReviewedAt: null,
        reviewCount: 0,
        deletedAt: null,
      },
      select: reviewSafeSelect,
    });
  },

  async update(id: number, userId: number, data: ReviewUpdateInput) {
    return prisma.review.update({
      where: { id, userId, deletedAt: null },
      data,
      select: reviewSafeSelect,
    });
  },

  async complete(id: number, userId: number, data: ReviewCompleteInput) {
    return prisma.review.update({
      where: { id, userId, deletedAt: null },
      data,
      select: reviewSafeSelect,
    });
  },

  async softDelete(id: number, userId: number) {
    return prisma.review.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: reviewSafeSelect,
    });
  },
};
