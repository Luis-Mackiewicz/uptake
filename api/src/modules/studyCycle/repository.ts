import { prisma } from "../../lib/prisma.js";
import type { Pagination } from "../../shared/domain.js";

export const studyCycleSafeSelect = {
  id: true,
  name: true,
  active: true,
  currentRound: true,
  nextItemOrder: true,
  examId: true,
  studyGroupId: true,
  priority: true,
  position: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  contents: {
    select: { contentId: true },
  },
} as const;

export const studyCycleContentSafeSelect = {
  contentId: true,
  position: true,
  minutesPerSession: true,
} as const;

type StudyCycleWithContents = {
  id: number;
  name: string;
  active: boolean;
  currentRound: number;
  nextItemOrder: number;
  examId: number;
  studyGroupId: number;
  priority: number;
  position: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  contents: { contentId: number }[];
};

export type SafeStudyCycle = Omit<StudyCycleWithContents, "contents"> & {
  contentIds: number[];
};

export type SafeStudyCycleContent = {
  contentId: number;
  position: number;
  minutesPerSession: number;
};

function toSafeCycle(record: StudyCycleWithContents): SafeStudyCycle {
  const { contents, ...cycle } = record;
  return {
    ...cycle,
    contentIds: contents.map((item) => item.contentId),
  };
}

export interface StudyCycleInput {
  name: string;
  active: boolean;
  studyGroupId: number;
  priority: number;
  position: number;
  contentIds: number[];
}

function activeCycleWhere(userId: number, examId?: number) {
  return {
    userId,
    deletedAt: null,
    exam: { deletedAt: null },
    studyGroup: { deletedAt: null },
    ...(examId === undefined ? {} : { examId }),
  };
}

export const studyCycleRepository = {
  async findById(id: number, userId: number, examId?: number) {
    const cycle = await prisma.studyCycle.findFirst({
      where: { id, ...activeCycleWhere(userId, examId) },
      select: studyCycleSafeSelect,
    });
    return cycle ? toSafeCycle(cycle) : null;
  },

  async findMany(userId: number, pagination: Pagination, examId?: number) {
    const where = activeCycleWhere(userId, examId);
    const [data, total] = await prisma.$transaction([
      prisma.studyCycle.findMany({
        where,
        select: studyCycleSafeSelect,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: [{ priority: "asc" }, { position: "asc" }],
      }),
      prisma.studyCycle.count({ where }),
    ]);
    return { data: data.map(toSafeCycle), total };
  },

  async create(userId: number, examId: number, data: StudyCycleInput) {
    const cycle = await prisma.studyCycle.create({
      data: {
        name: data.name,
        active: data.active,
        priority: data.priority,
        position: data.position,
        userId,
        examId,
        studyGroupId: data.studyGroupId,
        contents: {
          create: data.contentIds.map((contentId, index) => ({
            contentId,
            position: index + 1,
          })),
        },
      },
      select: studyCycleSafeSelect,
    });
    return toSafeCycle(cycle);
  },

  async update(
    id: number,
    userId: number,
    examId: number,
    data: StudyCycleInput,
  ) {
    const cycle = await prisma.studyCycle.update({
      where: { id, ...activeCycleWhere(userId, examId) },
      data: {
        name: data.name,
        active: data.active,
        priority: data.priority,
        position: data.position,
        studyGroupId: data.studyGroupId,
        contents: {
          deleteMany: {},
          create: data.contentIds.map((contentId, index) => ({
            contentId,
            position: index + 1,
          })),
        },
      },
      select: studyCycleSafeSelect,
    });
    return toSafeCycle(cycle);
  },

  async softDelete(id: number, userId: number, examId: number) {
    const cycle = await prisma.studyCycle.update({
      where: { id, ...activeCycleWhere(userId, examId) },
      data: { deletedAt: new Date(), position: -id },
      select: studyCycleSafeSelect,
    });
    return toSafeCycle(cycle);
  },

  async normalizePositions(examId: number, priority: number) {
    const cycles = await prisma.studyCycle.findMany({
      where: {
        examId,
        priority,
        deletedAt: null,
        studyGroup: { deletedAt: null },
      },
      select: { id: true },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });

    if (cycles.length === 0) return;

    await prisma.$transaction([
      ...cycles.map((cycle) =>
        prisma.studyCycle.update({
          where: { id: cycle.id },
          data: { position: -cycle.id },
        }),
      ),
      ...cycles.map((cycle, index) =>
        prisma.studyCycle.update({
          where: { id: cycle.id },
          data: { position: index + 1 },
        }),
      ),
    ]);
  },

  async reorder(examId: number, priority: number, ids: number[]) {
    await prisma.$transaction([
      ...ids.map((id) =>
        prisma.studyCycle.update({
          where: { id },
          data: { priority, position: -id },
        }),
      ),
      ...ids.map((id, index) =>
        prisma.studyCycle.update({
          where: { id },
          data: { priority, position: index + 1 },
        }),
      ),
    ]);
    return this.findManyByExam(examId);
  },

  async findManyByExam(examId: number) {
    const cycles = await prisma.studyCycle.findMany({
      where: {
        examId,
        deletedAt: null,
        exam: { deletedAt: null },
        studyGroup: { deletedAt: null },
      },
      select: studyCycleSafeSelect,
      orderBy: [{ priority: "asc" }, { position: "asc" }],
    });
    return cycles.map(toSafeCycle);
  },

  async updateState(
    id: number,
    userId: number,
    state: { currentRound: number; nextItemOrder: number },
  ) {
    const cycle = await prisma.studyCycle.update({
      where: { id, userId, deletedAt: null },
      data: state,
      select: studyCycleSafeSelect,
    });
    return toSafeCycle(cycle);
  },

  async findContents(cycleId: number) {
    return prisma.studyCycleContent.findMany({
      where: {
        cycleId,
        content: {
          deletedAt: null,
          studyGroup: { deletedAt: null },
        },
      },
      select: studyCycleContentSafeSelect,
      orderBy: { position: "asc" },
    });
  },
};
