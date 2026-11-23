import type { FastifyInstance } from "fastify";
import { toCrudPagination } from "../../shared/crud.service.js";
import { idParamSchema } from "../../shared/schemas.js";
import { privatePlugin } from "../../shared/routes.js";
import { parseSchema } from "../../shared/validation.js";
import {
  createNoteSchema,
  listNotesQuerySchema,
  reorderNotesSchema,
  updateNoteSchema,
} from "./schemas.js";
import { noteService } from "./service.js";

export async function noteRoutes(app: FastifyInstance) {
  await privatePlugin(app, (privateApp) => {
    privateApp.post("/notes", async (request, reply) => {
      const data = parseSchema(createNoteSchema, request.body);
      const note = await noteService.create(request.userId, data);
      return reply.status(201).send(note);
    });

    privateApp.get("/notes", async (request) => {
      const query = parseSchema(listNotesQuerySchema, request.query);
      const pagination = toCrudPagination(query.page, query.limit);
      return noteService.findAll(request.userId, pagination, query.contentId);
    });

    privateApp.patch("/notes/reorder", async (request) => {
      const { contentId, ids } = parseSchema(reorderNotesSchema, request.body);
      await noteService.reorder(request.userId, contentId, ids);
      return { ids };
    });

    privateApp.get("/notes/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return noteService.findById(request.userId, id);
    });

    privateApp.patch("/notes/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(updateNoteSchema, request.body);
      return noteService.update(request.userId, id, data);
    });

    privateApp.delete("/notes/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await noteService.remove(request.userId, id);
      return { message: "Nota removida com sucesso" };
    });
  });
}
