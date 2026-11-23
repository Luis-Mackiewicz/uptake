import type { FastifyInstance } from "fastify";
import { toCrudPagination } from "../../shared/crud.service.js";
import { idParamSchema } from "../../shared/schemas.js";
import { privatePlugin } from "../../shared/routes.js";
import { parseSchema } from "../../shared/validation.js";
import {
  createContentSchema,
  listContentsQuerySchema,
  reorderContentsSchema,
  updateContentSchema,
} from "./schemas.js";
import { contentService } from "./service.js";

export async function contentRoutes(app: FastifyInstance) {
  await privatePlugin(app, (privateApp) => {
    privateApp.post("/contents", async (request, reply) => {
      const data = parseSchema(createContentSchema, request.body);
      const content = await contentService.create(request.userId, data);
      return reply.status(201).send(content);
    });

    privateApp.get("/contents", async (request) => {
      const query = parseSchema(listContentsQuerySchema, request.query);
      const pagination = toCrudPagination(query.page, query.limit);
      return contentService.findAll(request.userId, pagination, query.studyGroupId);
    });

    privateApp.get("/contents/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return contentService.findById(request.userId, id);
    });

    privateApp.patch("/contents/reorder", async (request) => {
      const { studyGroupId, ids } = parseSchema(reorderContentsSchema, request.body);
      await contentService.reorder(request.userId, studyGroupId, ids);
      return { ids };
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
