import { prisma } from "../../lib/prisma.js";
import type { Pagination } from "../../shared/domain.js";

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

export const studyCycleItemSafeSelect = {
  id: true,
  studyCycleId: true,
  studyGroupId: true,
  position: true,
  minutesPerSession: true,
  createdAt: true,
} as const;

export interface StudyCycleInput {
  name: string;
  active: boolean;
}

export interface StudyCycleItemInput {
  studyGroupId: number;
  position: number;
  minutesPerSession: number;
}

export interface StudyCycleState {
  currentRound: number;
  nextItemOrder: number;
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

  async update(id: number, userId: number, data: StudyCycleInput) {
    return prisma.studyCycle.update({
      where: { id, userId, deletedAt: null },
      data,
      select: studyCycleSafeSelect,
    });
  },

  async softDelete(id: number, userId: number) {
    return prisma.studyCycle.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: studyCycleSafeSelect,
    });
  },

  async updateState(id: number, userId: number, state: StudyCycleState) {
    return prisma.studyCycle.update({
      where: { id, userId, deletedAt: null },
      data: state,
      select: studyCycleSafeSelect,
    });
  },

  async findItems(studyCycleId: number) {
    return prisma.studyCycleItem.findMany({
      where: { studyCycleId, deletedAt: null },
      select: studyCycleItemSafeSelect,
      orderBy: { position: "asc" },
    });
  },

  async findItemById(id: number, studyCycleId: number) {
    return prisma.studyCycleItem.findFirst({
      where: { id, studyCycleId, deletedAt: null },
      select: studyCycleItemSafeSelect,
    });
  },

  async findItemByPosition(
    studyCycleId: number,
    position: number,
    excludeId?: number,
  ) {
    return prisma.studyCycleItem.findFirst({
      where: {
        studyCycleId,
        position,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: studyCycleItemSafeSelect,
    });
  },

  async createItem(studyCycleId: number, data: StudyCycleItemInput) {
    return prisma.studyCycleItem.create({
      data: { ...data, studyCycleId },
      select: studyCycleItemSafeSelect,
    });
  },

  async updateItem(id: number, data: StudyCycleItemInput) {
    return prisma.studyCycleItem.update({
      where: { id },
      data: {
        studyGroupId: data.studyGroupId,
        position: data.position,
        minutesPerSession: data.minutesPerSession,
      },
      select: studyCycleItemSafeSelect,
    });
  },

  async softDeleteItem(id: number) {
    return prisma.studyCycleItem.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), position: -id },
      select: studyCycleItemSafeSelect,
    });
  },

  async normalizeItemPositions(studyCycleId: number) {
    const items = await prisma.studyCycleItem.findMany({
      where: { studyCycleId, deletedAt: null },
      select: { id: true },
      orderBy: { position: "asc" },
    });

    if (items.length === 0) {
      return;
    }

    await prisma.$transaction([
      ...items.map((item) =>
        prisma.studyCycleItem.update({
          where: { id: item.id },
          data: { position: -item.id },
        }),
      ),
      ...items.map((item, index) =>
        prisma.studyCycleItem.update({
          where: { id: item.id },
          data: { position: index + 1 },
        }),
      ),
    ]);
  },
};
