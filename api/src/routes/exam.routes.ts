import type { FastifyInstance } from "fastify";
import {
  createExamSchema,
  updateExamSchema,
} from "../schemas/exam.schemas.js";
import { idParamSchema } from "../schemas/id.schemas.js";
import { parsePagination } from "../schemas/pagination.schemas.js";
import { parseSchema } from "../schemas/parse.js";
import { examService } from "../services/exam.service.js";

export async function examRoutes(app: FastifyInstance) {
  app.post(
    "/exams",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const data = parseSchema(createExamSchema, request.body);
      const exam = await examService.create(Number(request.user.sub), data);
      return reply.status(201).send(exam);
    },
  );

  app.get(
    "/exams",
    { preHandler: [app.authenticate] },
    async (request) => {
      const pagination = parsePagination(request.query);
      return examService.findAll(Number(request.user.sub), pagination);
    },
  );

  app.get(
    "/exams/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return examService.findById(Number(request.user.sub), id);
    },
  );

  app.patch(
    "/exams/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(updateExamSchema, request.body);
      return examService.update(Number(request.user.sub), id, data);
    },
  );

  app.delete(
    "/exams/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await examService.remove(Number(request.user.sub), id);
      return { message: "Prova removida com sucesso" };
    },
  );
}
