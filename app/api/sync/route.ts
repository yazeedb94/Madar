import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import prisma from '@/prisma/client';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure db directory and file exist
function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ tenants: [], backups: {} }, null, 2), 'utf-8');
  }
}

function readDb() {
  initDb();
  try {
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading db.json', err);
    return { tenants: [], backups: {} };
  }
}

function writeDb(data: any) {
  initDb();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json', err);
  }
}

async function verifySyncSession(): Promise<{ valid: boolean; status?: number; error?: string }> {
  try {
    const cookieStore = await cookies();
    const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true';
    if (isSuperAdmin) {
      return { valid: true };
    }

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

export async function GET() {
  const check = await verifySyncSession();
  if (!check.valid) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const db = readDb();
  return NextResponse.json(db);
}

export async function POST(request: Request) {
  try {
    const check = await verifySyncSession();
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const payload = await request.json();
    const db = readDb();

    // Update tenants if provided
    if (payload.tenants) {
      db.tenants = payload.tenants;
    }

    // Update backups if provided
    if (payload.backups) {
      db.backups = {
        ...db.backups,
        ...payload.backups
      };
    }

    writeDb(db);
    return NextResponse.json({ success: true, db });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
