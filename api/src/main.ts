import fastify from "fastify";

const server = fastify({ logger: true });

server.get("/", async () => {
  return { message: "Servidor rodando!" };
});

try {
  await server.listen({ port: 3500, host: "0.0.0.0" });
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
