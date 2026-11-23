import { CrudService } from "../../shared/crud.service.js";
import { assertFound } from "../../shared/guards.js";
import type { ContentLookup } from "../../shared/ownership.js";
import { contentLookup } from "../content/index.js";
import { pomodoroSessionRepository } from "./repository.js";
import type { CreatePomodoroSessionData } from "./schemas.js";

type PomodoroRecord = NonNullable<
  Awaited<ReturnType<typeof pomodoroSessionRepository.findById>>
>;

export class PomodoroService extends CrudService<
  PomodoroRecord,
  CreatePomodoroSessionData,
  CreatePomodoroSessionData
> {
  private readonly sessionsRepository: typeof pomodoroSessionRepository;

  constructor(
    repository: typeof pomodoroSessionRepository = pomodoroSessionRepository,
    private readonly contents: ContentLookup = contentLookup,
  ) {
    super(repository, "Sessão de pomodoro não encontrada");
    this.sessionsRepository = repository;
  }

  override async create(userId: number, data: CreatePomodoroSessionData) {
    if (data.contentId !== null && data.contentId !== undefined) {
      assertFound(
        await this.contents.findById(data.contentId, userId),
        "Conteúdo não encontrado",
      );
    }

    return super.create(userId, data);
  }

  async finish(userId: number, id: number) {
    await this.findById(userId, id);
    return this.sessionsRepository.finish(id, userId);
  }
}

export const pomodoroService = new PomodoroService();
