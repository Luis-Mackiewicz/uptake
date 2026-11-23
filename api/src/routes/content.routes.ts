import type { FastifyInstance } from "fastify";
import {
  createContentSchema,
  updateContentSchema,
} from "../schemas/content.schemas.js";
import { idParamSchema } from "../schemas/id.schemas.js";
import { parsePagination } from "../schemas/pagination.schemas.js";
import { parseSchema } from "../schemas/parse.js";
import { contentService } from "../services/content.service.js";

export async function contentRoutes(app: FastifyInstance) {
  app.post(
    "/contents",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const data = parseSchema(createContentSchema, request.body);
      const content = await contentService.create(Number(request.user.sub), data);
      return reply.status(201).send(content);
    },
  );

  app.get(
    "/contents",
    { preHandler: [app.authenticate] },
    async (request) => {
      const pagination = parsePagination(request.query);
      return contentService.findAll(Number(request.user.sub), pagination);
    },
  );

  app.get(
    "/contents/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return contentService.findById(Number(request.user.sub), id);
    },
  );

  app.patch(
    "/contents/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(updateContentSchema, request.body);
      return contentService.update(Number(request.user.sub), id, data);
    },
  );

  app.delete(
    "/contents/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await contentService.remove(Number(request.user.sub), id);
      return { message: "Conteúdo removido com sucesso" };
    },
  );
}
