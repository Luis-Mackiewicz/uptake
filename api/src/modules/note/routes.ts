import type { FastifyInstance } from "fastify";
import { idParamSchema } from "../../schemas/id.schemas.js";
import { parsePagination } from "../../schemas/pagination.schemas.js";
import { privatePlugin } from "../../shared/routes.js";
import { parseSchema } from "../../shared/validation.js";
import { createNoteSchema, updateNoteSchema } from "./schemas.js";
import { noteService } from "./service.js";

export async function noteRoutes(app: FastifyInstance) {
  await privatePlugin(app, (privateApp) => {
    privateApp.post("/notes", async (request, reply) => {
      const data = parseSchema(createNoteSchema, request.body);
      const note = await noteService.create(request.userId, data);
      return reply.status(201).send(note);
    });

    privateApp.get("/notes", async (request) => {
      const pagination = parsePagination(request.query);
      return noteService.findAll(request.userId, pagination);
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
