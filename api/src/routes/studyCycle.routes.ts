import type { FastifyInstance } from "fastify";
import { idParamSchema } from "../schemas/id.schemas.js";
import { parsePagination } from "../schemas/pagination.schemas.js";
import { parseSchema } from "../schemas/parse.js";
import {
  createStudyCycleItemSchema,
  createStudyCycleSchema,
  studyCycleItemParamSchema,
  updateStudyCycleItemSchema,
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

  app.get(
    "/study-cycles/:id/items",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return studyCycleService.findItems(Number(request.user.sub), id);
    },
  );

  app.post(
    "/study-cycles/:id/items",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(createStudyCycleItemSchema, request.body);
      const item = await studyCycleService.addItem(
        Number(request.user.sub),
        id,
        data,
      );
      return reply.status(201).send(item);
    },
  );

  app.patch(
    "/study-cycles/:id/items/:itemId",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id, itemId } = parseSchema(
        studyCycleItemParamSchema,
        request.params,
      );
      const data = parseSchema(updateStudyCycleItemSchema, request.body);
      return studyCycleService.updateItem(
        Number(request.user.sub),
        id,
        itemId,
        data,
      );
    },
  );

  app.delete(
    "/study-cycles/:id/items/:itemId",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id, itemId } = parseSchema(
        studyCycleItemParamSchema,
        request.params,
      );
      await studyCycleService.removeItem(Number(request.user.sub), id, itemId);
      return { message: "Item do ciclo removido com sucesso" };
    },
  );

  app.post(
    "/study-cycles/:id/advance",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return studyCycleService.advance(Number(request.user.sub), id);
    },
  );
}
