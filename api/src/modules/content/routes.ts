import type { FastifyInstance } from "fastify";
import { idParamSchema } from "../../schemas/id.schemas.js";
import { parsePagination } from "../../schemas/pagination.schemas.js";
import { privatePlugin } from "../../shared/routes.js";
import { parseSchema } from "../../shared/validation.js";
import { createContentSchema, updateContentSchema } from "./schemas.js";
import { contentService } from "./service.js";

export async function contentRoutes(app: FastifyInstance) {
  await privatePlugin(app, (privateApp) => {
    privateApp.post("/contents", async (request, reply) => {
      const data = parseSchema(createContentSchema, request.body);
      const content = await contentService.create(request.userId, data);
      return reply.status(201).send(content);
    });

    privateApp.get("/contents", async (request) => {
      const pagination = parsePagination(request.query);
      return contentService.findAll(request.userId, pagination);
    });

    privateApp.get("/contents/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return contentService.findById(request.userId, id);
    });

    privateApp.patch("/contents/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(updateContentSchema, request.body);
      return contentService.update(request.userId, id, data);
    });

    privateApp.delete("/contents/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await contentService.remove(request.userId, id);
      return { message: "Conteúdo removido com sucesso" };
    });
  });
}
