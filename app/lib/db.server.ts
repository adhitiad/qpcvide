import { PrismaClient, Prisma } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || "";
  
  if (url.startsWith("prisma://")) {
    return new PrismaClient().$extends(withAccelerate()) as unknown as PrismaClient;
  }
  
  console.warn("⚠️ DATABASE_URL tidak dimulai dengan 'prisma://'. Prisma Accelerate dinonaktifkan (fallback ke Prisma Client biasa).");
  
  return new PrismaClient().$extends({
    name: "accelerate-fallback",
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          if (args && typeof args === "object" && "cacheStrategy" in args) {
            delete (args as any).cacheStrategy;
          }
          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
