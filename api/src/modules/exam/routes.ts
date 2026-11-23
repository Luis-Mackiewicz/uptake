import type { FastifyInstance } from "fastify";
import { idParamSchema } from "../../schemas/id.schemas.js";
import { parsePagination } from "../../schemas/pagination.schemas.js";
import { privatePlugin } from "../../shared/routes.js";
import { parseSchema } from "../../shared/validation.js";
import { createExamSchema, updateExamSchema } from "./schemas.js";
import { examService } from "./service.js";

export async function examRoutes(app: FastifyInstance) {
  await privatePlugin(app, (privateApp) => {
    privateApp.post("/exams", async (request, reply) => {
      const data = parseSchema(createExamSchema, request.body);
      const exam = await examService.create(request.userId, data);
      return reply.status(201).send(exam);
    });

    privateApp.get("/exams", async (request) => {
      const pagination = parsePagination(request.query);
      return examService.findAll(request.userId, pagination);
    });

    privateApp.get("/exams/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return examService.findById(request.userId, id);
    });

    privateApp.patch("/exams/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(updateExamSchema, request.body);
      return examService.update(request.userId, id, data);
    });

    privateApp.delete("/exams/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await examService.remove(request.userId, id);
      return { message: "Prova removida com sucesso" };
    });
  });
}
