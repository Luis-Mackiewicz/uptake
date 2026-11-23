import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; email: string };
    user: { sub: string; email: string };
  }
}

export default fp(async (fastify) => {
  fastify.register(jwt, {
    secret: env.jwtSecret,
  });

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const userId = Number(request.user.sub);

        if (!Number.isInteger(userId) || userId <= 0) {
          throw new Error("Invalid subject");
        }

        request.userId = userId;
      } catch {
        return reply.status(401).send({ error: "Token inválido ou ausente" });
      }
    },
  );
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }

  interface FastifyRequest {
    userId: number;
  }
}
