import type { FastifyInstance } from "fastify";
import { idParamSchema } from "../schemas/id.schemas.js";
import { parsePagination } from "../schemas/pagination.schemas.js";
import { parseSchema } from "../schemas/parse.js";
import {
  createStudyGroupSchema,
  updateStudyGroupSchema,
} from "../schemas/studyGroup.schemas.js";
import { studyGroupService } from "../services/studyGroup.service.js";

export async function studyGroupRoutes(app: FastifyInstance) {
  app.post(
    "/study-groups",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const data = parseSchema(createStudyGroupSchema, request.body);
      const studyGroup = await studyGroupService.create(
        Number(request.user.sub),
        data,
      );
      return reply.status(201).send(studyGroup);
    },
  );

  app.get(
    "/study-groups",
    { preHandler: [app.authenticate] },
    async (request) => {
      const pagination = parsePagination(request.query);
      return studyGroupService.findAll(Number(request.user.sub), pagination);
    },
  );

  app.get(
    "/study-groups/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return studyGroupService.findById(Number(request.user.sub), id);
    },
  );

  app.patch(
    "/study-groups/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(updateStudyGroupSchema, request.body);
      return studyGroupService.update(Number(request.user.sub), id, data);
    },
  );

  app.delete(
    "/study-groups/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await studyGroupService.remove(Number(request.user.sub), id);
      return { message: "Grupo de estudo removido com sucesso" };
    },
  );
}
