import {
  CrudService,
  type CrudRepository,
} from "../../shared/crud.service.js";
import { assertFound } from "../../shared/guards.js";
import type { ContentLookup } from "../../shared/ownership.js";
import { contentLookup } from "../content/index.js";
import { pomodoroSessionRepository } from "./repository.js";
import type { CreatePomodoroSessionData } from "./schemas.js";

type PomodoroRecord = NonNullable<
  Awaited<ReturnType<typeof pomodoroSessionRepository.findById>>
>;

interface PomodoroRepository
  extends CrudRepository<
    PomodoroRecord,
    CreatePomodoroSessionData,
    CreatePomodoroSessionData
  > {
  finish(id: number, userId: number): Promise<PomodoroRecord>;
}

export class PomodoroService extends CrudService<
  PomodoroRecord,
  CreatePomodoroSessionData,
  CreatePomodoroSessionData,
  PomodoroRepository
> {
  constructor(
    repository: PomodoroRepository = pomodoroSessionRepository,
    private readonly contents: ContentLookup = contentLookup,
  ) {
    super(repository, "Sessão de pomodoro não encontrada");
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
    return this.repository.finish(id, userId);
  }
}

export const pomodoroService = new PomodoroService();
