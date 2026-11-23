import type { FastifyInstance } from "fastify";
import { idParamSchema } from "../schemas/id.schemas.js";
import { parsePagination } from "../schemas/pagination.schemas.js";
import { parseSchema } from "../schemas/parse.js";
import {
  createStudyCycleSchema,
  updateStudyCycleSchema,
} from "../schemas/studyCycle.schemas.js";
import { studyCycleService } from "../services/studyCycle.service.js";

export async function studyCycleRoutes(app: FastifyInstance) {
  app.post(
    "/study-cycles",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const data = parseSchema(createStudyCycleSchema, request.body);
      const studyCycle = await studyCycleService.create(
        Number(request.user.sub),
        data,
      );
      return reply.status(201).send(studyCycle);
    },
  );

  app.get(
    "/study-cycles",
    { preHandler: [app.authenticate] },
    async (request) => {
      const pagination = parsePagination(request.query);
      return studyCycleService.findAll(Number(request.user.sub), pagination);
    },
  );

  app.get(
    "/study-cycles/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return studyCycleService.findById(Number(request.user.sub), id);
    },
  );

  app.patch(
    "/study-cycles/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(updateStudyCycleSchema, request.body);
      return studyCycleService.update(Number(request.user.sub), id, data);
    },
  );

  app.delete(
    "/study-cycles/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await studyCycleService.remove(Number(request.user.sub), id);
      return { message: "Ciclo de estudos removido com sucesso" };
    },
  );
}
