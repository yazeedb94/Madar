import { PrismaClient } from '@prisma/client';

const getPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL || '';
  
  if (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) {
    try {
      const { Pool } = require('pg');
      const { PrismaPg } = require('@prisma/adapter-pg');
      
      const pool = new Pool({ connectionString });
      const adapter = new PrismaPg(pool);
      return new PrismaClient({ adapter });
    } catch (e) {
      console.error('Failed to initialize Postgres adapter in Prisma 7:', e);
      return new PrismaClient();
    }
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
