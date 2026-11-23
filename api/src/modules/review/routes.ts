import type { FastifyInstance } from "fastify";
import { idParamSchema } from "../../shared/schemas.js";
import { privatePlugin } from "../../shared/routes.js";
import { parseSchema } from "../../shared/validation.js";
import {
  createReviewSchema,
  reviewQuerySchema,
  updateReviewSchema,
} from "./schemas.js";
import { reviewService } from "./service.js";

export async function reviewRoutes(app: FastifyInstance) {
  await privatePlugin(app, (privateApp) => {
    privateApp.post("/reviews", async (request, reply) => {
      const data = parseSchema(createReviewSchema, request.body);
      const review = await reviewService.create(request.userId, data);
      return reply.status(201).send(review);
    });

    privateApp.get("/reviews", async (request) => {
      const query = parseSchema(reviewQuerySchema, request.query);
      return reviewService.findAllDue(request.userId, query);
    });

    privateApp.get("/reviews/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return reviewService.findById(request.userId, id);
    });

    privateApp.patch("/reviews/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      const data = parseSchema(updateReviewSchema, request.body);
      return reviewService.update(request.userId, id, data);
    });

    privateApp.post("/reviews/:id/complete", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      return reviewService.complete(request.userId, id);
    });

    privateApp.delete("/reviews/:id", async (request) => {
      const { id } = parseSchema(idParamSchema, request.params);
      await reviewService.remove(request.userId, id);
      return { message: "Revisão removida com sucesso" };
    });
  });
}
