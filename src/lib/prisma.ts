import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** node-postgres rejects Prisma-only URL flags like pgbouncer=true. */
function postgresConfig(connectionString: string) {
  const url = new URL(connectionString);
  const connectionLimit = Number(url.searchParams.get("connection_limit"));
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("connection_limit");
  url.searchParams.delete("pool_timeout");
  url.searchParams.delete("socket_timeout");

  return {
    connectionString: url.toString(),
    max:
      Number.isFinite(connectionLimit) && connectionLimit > 0
        ? connectionLimit
        : process.env.NODE_ENV === "production"
          ? 1
          : 10,
  };
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const adapter = new PrismaPg(postgresConfig(connectionString));
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
