import { PrismaClient, Prisma } from "@prisma/client";

const isDev = process.env.NODE_ENV !== "production";

const logLevels: Prisma.LogLevel[] = isDev
  ? ["query", "info", "warn", "error"]
  : ["warn", "error"];

export const prisma = new PrismaClient({
  errorFormat: "pretty",
  log: logLevels,
});

async function handleExit() {
  try {
    await prisma.$disconnect();
  } catch {
    // ignore shutdown errors
  }
}

process.on("SIGINT", () => {
  void handleExit();
});

process.on("SIGTERM", () => {
  void handleExit();
});

export default prisma;
