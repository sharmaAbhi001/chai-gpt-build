import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConfigKey: string | undefined;
};

function normalizeCa(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

function sanitizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("sslrootcert");
    parsed.searchParams.delete("sslcert");
    return parsed.toString();
  } catch {
    return url;
  }
}

function buildSslConfig():
  | { ca?: string; rejectUnauthorized: boolean }
  | undefined {
  const caRaw = process.env.DATABASE_CA_CERT;
  const ca = caRaw ? normalizeCa(caRaw) : undefined;

  // Prisma 7 + node-pg enforces TLS strictly (P1011). Set to "false" for
  // managed DBs with project/self-signed CAs when the PEM alone is not enough.
  const rejectUnauthorized =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false";

  if (ca) {
    return { ca, rejectUnauthorized };
  }

  if (!rejectUnauthorized) {
    return { rejectUnauthorized: false };
  }

  return undefined;
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DB URL not found");
  }

  const ssl = buildSslConfig();

  const adapter = new PrismaPg({
    connectionString: ssl ? sanitizeDatabaseUrl(url) : url,
    ssl,
  });

  return new PrismaClient({ adapter });
}

const configKey = [
  process.env.DATABASE_URL ?? "",
  process.env.DATABASE_CA_CERT ? "ca" : "no-ca",
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ?? "true",
].join("|");

if (globalForPrisma.prismaConfigKey !== configKey) {
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaConfigKey = configKey;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
