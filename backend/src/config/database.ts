import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

const prismaOptions = {
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'event', level: 'query' } as const]
    : [],
};

export const prisma = globalThis.__prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

if (process.env.NODE_ENV === 'development') {
  (prisma as any).$on('query', (e: { query: string; duration: number }) => {
    if (e.duration > 1000) {
      logger.warn(`Requête lente (${e.duration}ms): ${e.query}`);
    }
  });
}

export default prisma;
