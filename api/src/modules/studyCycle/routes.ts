import type { FastifyInstance } from "fastify";
import {
  idParamSchema,
  parsePagination,
} from "../../shared/schemas.js";
import { privatePlugin } from "../../shared/routes.js";
import { parseSchema } from "../../shared/validation.js";
import {
  createStudyCycleItemSchema,
  createStudyCycleSchema,
  studyCycleItemParamSchema,
  updateStudyCycleItemSchema,
  updateStudyCycleSchema,
} from "./schemas.js";
import { studyCycleService } from "./service.js";

export async function studyCycleRoutes(app: FastifyInstance) {
  await privatePlugin(app, (privateApp) => {
    privateApp.post("/study-cycles", async (request, reply) => {
      const data = parseSchema(createStudyCycleSchema, request.body);
      const studyCycle = await studyCycleService.create(request.userId, data);
      return reply.status(201).send(studyCycle);
    });

    privateApp.get("/study-cycles", async (request) => {
      const pagination = parsePagination(request.query);
      return studyCycleService.findAll(request.userId, pagination);
    });

    privateApp.get("/study-cycles/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return studyCycleService.findById(request.userId, id);
    });

    privateApp.patch("/study-cycles/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(updateStudyCycleSchema, request.body);
      return studyCycleService.update(request.userId, id, data);
    });

    privateApp.delete("/study-cycles/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await studyCycleService.remove(request.userId, id);
      return { message: "Ciclo de estudos removido com sucesso" };
    });

    privateApp.get("/study-cycles/:id/items", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return studyCycleService.findItems(request.userId, id);
    });

    privateApp.post("/study-cycles/:id/items", async (request, reply) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(createStudyCycleItemSchema, request.body);
      const item = await studyCycleService.addItem(request.userId, id, data);
      return reply.status(201).send(item);
    });

    privateApp.patch("/study-cycles/:id/items/:itemId", async (request) => {
      const { id, itemId } = parseSchema(
        studyCycleItemParamSchema,
        request.params,
      );
      const data = parseSchema(updateStudyCycleItemSchema, request.body);
      return studyCycleService.updateItem(request.userId, id, itemId, data);
    });

    privateApp.delete("/study-cycles/:id/items/:itemId", async (request) => {
      const { id, itemId } = parseSchema(
        studyCycleItemParamSchema,
        request.params,
      );
      await studyCycleService.removeItem(request.userId, id, itemId);
      return { message: "Item do ciclo removido com sucesso" };
    });

    privateApp.post("/study-cycles/:id/advance", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return studyCycleService.advance(request.userId, id);
    });
  });
}
