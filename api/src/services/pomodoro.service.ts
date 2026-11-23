import { NotFoundError } from "../errors/AppError.js";
import { contentRepository } from "../repositories/content.repository.js";
import { pomodoroSessionRepository } from "../repositories/pomodoroSession.repository.js";
import {
  toPaginated,
  type Pagination,
} from "../schemas/pagination.schemas.js";
import type { CreatePomodoroSessionData } from "../schemas/pomodoro.schemas.js";

export class PomodoroService {
  constructor(
    private readonly repository: typeof pomodoroSessionRepository = pomodoroSessionRepository,
    private readonly contents: typeof contentRepository = contentRepository,
  ) {}

  async create(userId: number, data: CreatePomodoroSessionData) {
    if (data.contentId !== null && data.contentId !== undefined) {
      const content = await this.contents.findById(data.contentId, userId);

      if (!content) {
        throw new NotFoundError("Conteúdo não encontrado");
      }
    }

    return this.repository.create(userId, data);
  }

  async findAll(userId: number, pagination: Pagination) {
    const { data, total } = await this.repository.findMany(userId, pagination);
    return toPaginated(data, total, pagination);
  }

  async findById(userId: number, id: number) {
    const session = await this.repository.findById(id, userId);

    if (!session) {
      throw new NotFoundError("Sessão de pomodoro não encontrada");
    }

    return session;
  }

  async finish(userId: number, id: number) {
    await this.findById(userId, id);
    return this.repository.finish(id);
  }

  async remove(userId: number, id: number) {
    await this.findById(userId, id);
    return this.repository.softDelete(id);
  }
}

export const pomodoroService = new PomodoroService();
