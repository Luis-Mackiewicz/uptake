import type { FastifyInstance } from "fastify";
import { parsePagination } from "../../shared/schemas.js";
import { privatePlugin } from "../../shared/routes.js";
import { parseSchema } from "../../shared/validation.js";
import {
  createStudyCycleSchema,
  examCycleParamSchema,
  examIdParamSchema,
  reorderStudyCyclesSchema,
  updateStudyCycleSchema,
} from "./schemas.js";
import { studyCycleService } from "./service.js";

export async function studyCycleRoutes(app: FastifyInstance) {
  await privatePlugin(app, (privateApp) => {
    privateApp.get("/exams/:examId/cycles", async (request) => {
      const { examId } = parseSchema(examIdParamSchema, request.params);
      const pagination = parsePagination(request.query);
      const cycles = await studyCycleService.findAllByExam(
        request.userId,
        examId,
      );
      return {
        data: cycles.slice(pagination.skip, pagination.skip + pagination.limit),
        total: cycles.length,
      };
    });

    privateApp.post("/exams/:examId/cycles", async (request, reply) => {
      const { examId } = parseSchema(examIdParamSchema, request.params);
      const data = parseSchema(createStudyCycleSchema, request.body);
      const cycle = await studyCycleService.create(request.userId, examId, data);
      return reply.status(201).send(cycle);
    });

    privateApp.post("/exams/:examId/cycles/reorder", async (request) => {
      const { examId } = parseSchema(examIdParamSchema, request.params);
      const data = parseSchema(reorderStudyCyclesSchema, request.body);
      return studyCycleService.reorder(request.userId, examId, data);
    });

    privateApp.get("/exams/:examId/cycles/:cycleId", async (request) => {
      const { examId, cycleId } = parseSchema(
        examCycleParamSchema,
        request.params,
      );
      return studyCycleService.findById(request.userId, examId, cycleId);
    });

    privateApp.patch("/exams/:examId/cycles/:cycleId", async (request) => {
      const { examId, cycleId } = parseSchema(
        examCycleParamSchema,
        request.params,
      );
      const data = parseSchema(updateStudyCycleSchema, request.body);
      return studyCycleService.update(request.userId, examId, cycleId, data);
    });

    privateApp.delete("/exams/:examId/cycles/:cycleId", async (request) => {
      const { examId, cycleId } = parseSchema(
        examCycleParamSchema,
        request.params,
      );
      await studyCycleService.remove(request.userId, examId, cycleId);
      return { message: "Ciclo de estudos removido com sucesso" };
    });

    privateApp.post("/exams/:examId/cycles/:cycleId/advance", async (request) => {
      const { examId, cycleId } = parseSchema(
        examCycleParamSchema,
        request.params,
      );
      return studyCycleService.advance(request.userId, examId, cycleId);
    });
  });
}
