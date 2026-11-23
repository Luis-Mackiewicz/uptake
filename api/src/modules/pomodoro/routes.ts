import type { FastifyInstance } from "fastify";
import { idParamSchema } from "../../schemas/id.schemas.js";
import { parsePagination } from "../../schemas/pagination.schemas.js";
import { privatePlugin } from "../../shared/routes.js";
import { parseSchema } from "../../shared/validation.js";
import { createPomodoroSessionSchema } from "./schemas.js";
import { pomodoroService } from "./service.js";

export async function pomodoroRoutes(app: FastifyInstance) {
  await privatePlugin(app, (privateApp) => {
    privateApp.post("/pomodoro-sessions", async (request, reply) => {
      const data = parseSchema(createPomodoroSessionSchema, request.body);
      const session = await pomodoroService.create(request.userId, data);
      return reply.status(201).send(session);
    });

    privateApp.get("/pomodoro-sessions", async (request) => {
      const pagination = parsePagination(request.query);
      return pomodoroService.findAll(request.userId, pagination);
    });

    privateApp.get("/pomodoro-sessions/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return pomodoroService.findById(request.userId, id);
    });

    privateApp.post("/pomodoro-sessions/:id/finish", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return pomodoroService.finish(request.userId, id);
    });

    privateApp.delete("/pomodoro-sessions/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await pomodoroService.remove(request.userId, id);
      return { message: "Sessão de pomodoro removida com sucesso" };
    });
  });
}
