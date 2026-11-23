import createApp from "./app.js";
import { env } from "./config/env.js";

const server = await createApp();

async function shutdown(signal: NodeJS.Signals) {
  try {
    await server.close();
    server.log.info({ signal }, "server closed");
    process.exit(0);
  } catch (err) {
    server.log.error(err, "error during shutdown");
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

try {
  await server.listen({ port: env.port, host: "0.0.0.0" });
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
