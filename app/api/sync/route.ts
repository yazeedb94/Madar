import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/prisma/client';

// ─── Auth Helper ─────────────────────────────────────────────────────────────

async function verifySyncSession(): Promise<{ valid: boolean; status?: number; error?: string }> {
  try {
    const cookieStore = await cookies();
    const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true';
    if (isSuperAdmin) return { valid: true };

    const tenantId = cookieStore.get('tenant_id')?.value;
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!tenantId) {
      return { valid: false, status: 401, error: 'Unauthorized: No active business context' };
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return { valid: false, status: 401, error: 'Unauthorized: Business account not found' };
    }
    if (tenant.status === 'suspended') {
      return { valid: false, status: 403, error: 'Forbidden: Account suspended' };
    }
    if (tenant.status === 'banned') {
      return { valid: false, status: 403, error: 'Forbidden: Account banned' };
    }
    if (!sessionToken) {
      return { valid: false, status: 401, error: 'Unauthorized: No active session' };
    }

    const activeSession = await prisma.activeSession.findUnique({ where: { id: sessionToken } });
    if (!activeSession) {
      return { valid: false, status: 401, error: 'Unauthorized: Session terminated' };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, status: 500, error: err.message };
  }
}

// ─── GET — return all tenant backups ─────────────────────────────────────────

export async function GET() {
  const check = await verifySyncSession();
  if (!check.valid) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const rows = await prisma.tenantBackup.findMany();

    // Reconstruct the same shape the client expects: { backups: { [tenantId]: { settings, customers, ... } } }
    const backups: Record<string, any> = {};
    for (const row of rows) {
      try {
        backups[row.tenantId] = JSON.parse(row.data);
      } catch {
        backups[row.tenantId] = row.data;
      }
    }

    return NextResponse.json({ tenants: [], backups });
  } catch (err: any) {
    console.error('[sync GET] Prisma error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST — save / merge tenant backups ──────────────────────────────────────

export async function POST(request: Request) {
  try {
    const check = await verifySyncSession();
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const payload = await request.json();

    if (payload.backups) {
      // Upsert each tenant's backup into PostgreSQL
      const upserts = Object.entries(payload.backups).map(([tenantId, backupData]) => {
        const dataStr = typeof backupData === 'string'
          ? backupData
          : JSON.stringify(backupData);

        return prisma.tenantBackup.upsert({
          where: { tenantId },
          update: { data: dataStr, updatedAt: new Date() },
          create: { tenantId, data: dataStr, updatedAt: new Date() },
        });
      });

      await Promise.all(upserts);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[sync POST] Prisma error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
