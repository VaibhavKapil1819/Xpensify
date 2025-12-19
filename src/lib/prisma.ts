// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create Prisma client instance
// In development, reuse the same instance to avoid too many connections
export const prisma =
    globalForPrisma.prisma || new PrismaClient();

// Disconnect on process termination
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
    
    // Handle graceful shutdown
    process.on('beforeExit', async () => {
        await prisma.$disconnect();
    });
}