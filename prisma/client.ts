import { PrismaClient } from '@prisma/client';

const getPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL || '';
  
  if (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) {
    return new PrismaClient();
  }
  
  try {
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    const adapter = new PrismaBetterSqlite3({
      url: connectionString || 'file:./dev.db',
    });
    return new PrismaClient({ adapter });
  } catch (e) {
    return new PrismaClient();
  }
};

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const prisma = globalForPrisma.prisma ?? getPrismaClient();
export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
