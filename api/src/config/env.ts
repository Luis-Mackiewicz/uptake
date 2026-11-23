import "dotenv/config";

interface DatabaseEnv {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface Env {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  database: DatabaseEnv;
}

const rawDatabaseUrl = process.env.DATABASE_URL;

if (!rawDatabaseUrl) {
  throw new Error("DATABASE_URL não está definida");
}

let databaseUrl: URL;

try {
  databaseUrl = new URL(rawDatabaseUrl);
} catch {
  throw new Error("DATABASE_URL é inválida");
}

const databasePort = databaseUrl.port ? Number(databaseUrl.port) : 3306;

if (!Number.isInteger(databasePort) || databasePort <= 0) {
  throw new Error("DATABASE_URL possui uma porta inválida");
}

const port = Number(process.env.PORT ?? 3500);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT deve ser um número inteiro positivo");
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET não está definido");
}

export const env: Env = {
  port,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  database: {
    host: databaseUrl.hostname,
    port: databasePort,
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: decodeURIComponent(databaseUrl.pathname.replace(/^\//, "")),
  },
};
