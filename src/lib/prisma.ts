import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Singleton : évite d'ouvrir une nouvelle connexion à chaque hot-reload en dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const connectionString = process.env.DATABASE_URL;

// Le paramètre `?schema=` de DATABASE_URL est lu par `prisma migrate`, mais pas par
// l'adaptateur pg : on le lui transmet explicitement pour que l'application et les
// migrations utilisent le même schéma (ex. schéma personnel sur le serveur pedago).
const schema = connectionString
  ? (new URL(connectionString).searchParams.get("schema") ?? undefined)
  : undefined;

const adapter = new PrismaPg({ connectionString }, { schema });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
