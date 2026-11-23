import type { FastifyInstance } from "fastify";
import { idParamSchema } from "../schemas/id.schemas.js";
import { parsePagination } from "../schemas/pagination.schemas.js";
import { parseSchema } from "../schemas/parse.js";
import { createPomodoroSessionSchema } from "../schemas/pomodoro.schemas.js";
import { pomodoroService } from "../services/pomodoro.service.js";

export async function pomodoroRoutes(app: FastifyInstance) {
  app.post(
    "/pomodoro-sessions",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const data = parseSchema(createPomodoroSessionSchema, request.body);
      const session = await pomodoroService.create(Number(request.user.sub), data);
      return reply.status(201).send(session);
    },
  );

  app.get(
    "/pomodoro-sessions",
    { preHandler: [app.authenticate] },
    async (request) => {
      const pagination = parsePagination(request.query);
      return pomodoroService.findAll(Number(request.user.sub), pagination);
    },
  );

  app.get(
    "/pomodoro-sessions/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return pomodoroService.findById(Number(request.user.sub), id);
    },
  );

  app.post(
    "/pomodoro-sessions/:id/finish",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return pomodoroService.finish(Number(request.user.sub), id);
    },
  );

  app.delete(
    "/pomodoro-sessions/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await pomodoroService.remove(Number(request.user.sub), id);
      return { message: "Sessão de pomodoro removida com sucesso" };
    },
  );
}
