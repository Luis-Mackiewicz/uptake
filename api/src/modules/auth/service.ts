import bcrypt from "bcryptjs";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/AppError.js";
import {
  userRepository,
  type CreateUserInput,
  type UpdateUserInput,
} from "./repository.js";
import type {
  CreateUserData,
  LoginData,
  UpdateUserData,
} from "./schemas.js";

type UserRecord = NonNullable<
  Awaited<ReturnType<typeof userRepository.findActiveById>>
>;

interface UserRepository {
  findByEmailOrCpfIncludingDeleted(
    email: string,
    cpf: string,
  ): Promise<{ id: number; deletedAt: Date | null } | null>;
  findActiveByEmailWithPassword(
    email: string,
  ): Promise<{ id: number; email: string; passwordHash: string } | null>;
  findActiveById(id: number): Promise<UserRecord | null>;
  findActiveByCpf(cpf: string, excludeId: number): Promise<{ id: number } | null>;
  create(data: CreateUserInput): Promise<UserRecord>;
  reactivate(id: number, data: CreateUserInput): Promise<UserRecord>;
  update(id: number, data: UpdateUserInput): Promise<UserRecord>;
}

export class AuthService {
  constructor(
    private readonly repository: UserRepository = userRepository,
  ) {}

  async register(data: CreateUserData) {
    const existing = await this.repository.findByEmailOrCpfIncludingDeleted(
      data.email,
      data.cpf,
    );

    if (existing && existing.deletedAt === null) {
      throw new ConflictError("E-mail ou CPF já cadastrado");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const userData = {
      name: data.name,
      email: data.email,
      cpf: data.cpf,
      passwordHash,
      musicUrl: data.musicUrl ?? null,
    };

    if (existing) {
      return this.repository.reactivate(existing.id, userData);
    }

    return this.repository.create(userData);
  }

  async authenticate(data: LoginData) {
    const user = await this.repository.findActiveByEmailWithPassword(data.email);

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new UnauthorizedError("Credenciais inválidas");
    }

    return { id: user.id, email: user.email };
  }

  async getProfile(userId: number) {
    const user = await this.repository.findActiveById(userId);

    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    return user;
  }

  async updateProfile(userId: number, data: UpdateUserData) {
    const user = await this.repository.findActiveById(userId);

    if (!user) {
      throw new NotFoundError("Usuário não encontrado");
    }

    const cpfConflict = await this.repository.findActiveByCpf(data.cpf, userId);

    if (cpfConflict) {
      throw new ConflictError("CPF já cadastrado");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.repository.update(userId, {
      name: data.name,
      cpf: data.cpf,
      passwordHash,
      musicUrl: data.musicUrl,
    });
  }
}

export const authService = new AuthService();
