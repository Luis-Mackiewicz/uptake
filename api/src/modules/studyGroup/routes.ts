import type { FastifyInstance } from "fastify";
import {
  idParamSchema,
  parsePagination,
} from "../../shared/schemas.js";
import { privatePlugin } from "../../shared/routes.js";
import { parseSchema } from "../../shared/validation.js";
import { createStudyGroupSchema, updateStudyGroupSchema } from "./schemas.js";
import { studyGroupService } from "./service.js";

export async function studyGroupRoutes(app: FastifyInstance) {
  await privatePlugin(app, (privateApp) => {
    privateApp.post("/study-groups", async (request, reply) => {
      const data = parseSchema(createStudyGroupSchema, request.body);
      const studyGroup = await studyGroupService.create(request.userId, data);
      return reply.status(201).send(studyGroup);
    });

    privateApp.get("/study-groups", async (request) => {
      const pagination = parsePagination(request.query);
      return studyGroupService.findAll(request.userId, pagination);
    });

    privateApp.get("/study-groups/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return studyGroupService.findById(request.userId, id);
    });

    privateApp.patch("/study-groups/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(updateStudyGroupSchema, request.body);
      return studyGroupService.update(request.userId, id, data);
    });

    privateApp.delete("/study-groups/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await studyGroupService.remove(request.userId, id);
      return { message: "Grupo de estudo removido com sucesso" };
    });
  });
}
