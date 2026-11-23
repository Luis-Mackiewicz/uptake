import type { FastifyInstance } from "fastify";
import { idParamSchema } from "../schemas/id.schemas.js";
import { parseSchema } from "../schemas/parse.js";
import {
  createReviewSchema,
  reviewQuerySchema,
  updateReviewSchema,
} from "../schemas/review.schemas.js";
import { reviewService } from "../services/review.service.js";

export async function reviewRoutes(app: FastifyInstance) {
  app.post(
    "/reviews",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const data = parseSchema(createReviewSchema, request.body);
      const review = await reviewService.create(Number(request.user.sub), data);
      return reply.status(201).send(review);
    },
  );

  app.get(
    "/reviews",
    { preHandler: [app.authenticate] },
    async (request) => {
      const query = parseSchema(reviewQuerySchema, request.query);
      return reviewService.findAll(Number(request.user.sub), query);
    },
  );

  app.get(
    "/reviews/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return reviewService.findById(Number(request.user.sub), id);
    },
  );

  app.patch(
    "/reviews/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(updateReviewSchema, request.body);
      return reviewService.update(Number(request.user.sub), id, data);
    },
  );

  app.post(
    "/reviews/:id/complete",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return reviewService.complete(Number(request.user.sub), id);
    },
  );

  app.delete(
    "/reviews/:id",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await reviewService.remove(Number(request.user.sub), id);
      return { message: "Revisão removida com sucesso" };
    },
  );
}
