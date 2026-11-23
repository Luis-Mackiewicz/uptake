import { prisma } from "../../lib/prisma.js";

export const userSafeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  cpf: true,
  musicUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  passwordHash: string;
  musicUrl: string | null;
}

export interface UpdateUserInput {
  firstName: string;
  lastName: string;
  cpf: string;
  passwordHash: string;
  musicUrl?: string | null;
}

export const userRepository = {
  async findByEmailOrCpfIncludingDeleted(email: string, cpf: string) {
    return prisma.user.findFirst({
      where: { OR: [{ email }, { cpf }] },
      select: { id: true, deletedAt: true },
    });
  },

  async findActiveByEmailWithPassword(email: string) {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  },

  async findActiveById(id: number) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSafeSelect,
    });
  },

  async findActiveByCpf(cpf: string, excludeId: number) {
    return prisma.user.findFirst({
      where: { cpf, deletedAt: null, id: { not: excludeId } },
      select: { id: true },
    });
  },

  async create(data: CreateUserInput) {
    return prisma.user.create({ data, select: userSafeSelect });
  },

  async reactivate(id: number, data: CreateUserInput) {
    return prisma.user.update({
      where: { id },
      data: { ...data, deletedAt: null },
      select: userSafeSelect,
    });
  },

  async update(id: number, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id, deletedAt: null },
      data,
      select: userSafeSelect,
    });
  },
};
