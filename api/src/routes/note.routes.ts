import type { FastifyInstance } from "fastify";
import { idParamSchema } from "../schemas/id.schemas.js";
import {
  createNoteSchema,
  updateNoteSchema,
} from "../schemas/note.schemas.js";
import { parsePagination } from "../schemas/pagination.schemas.js";
import { parseSchema } from "../schemas/parse.js";
import { noteService } from "../services/note.service.js";

export async function noteRoutes(app: FastifyInstance) {
  app.post(
    "/notes",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const data = parseSchema(createNoteSchema, request.body);
      const note = await noteService.create(Number(request.user.sub), data);
      return reply.status(201).send(note);
    },
  );

  app.get(
    "/notes",
    { preHandler: [app.authenticate] },
    async (request) => {
      const pagination = parsePagination(request.query);
      return noteService.findAll(Number(request.user.sub), pagination);
    },
  );

  app.get(
    "/notes/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return noteService.findById(Number(request.user.sub), id);
    },
  );

  app.patch(
    "/notes/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(updateNoteSchema, request.body);
      return noteService.update(Number(request.user.sub), id, data);
    },
  );

  app.delete(
    "/notes/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await noteService.remove(Number(request.user.sub), id);
      return { message: "Nota removida com sucesso" };
    },
  );
}
