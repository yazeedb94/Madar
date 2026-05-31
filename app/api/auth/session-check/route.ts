import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/prisma/client';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    const tenantId = cookieStore.get('tenant_id')?.value;

    const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true';
    if (isSuperAdmin) {
      return NextResponse.json({ valid: true, isSuper: true });
    }

    if (!tenantId) {
      return NextResponse.json({ valid: false, reason: 'no_tenant' }, { status: 401 });
    }

    // 1. Fetch tenant from database
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ valid: false, reason: 'tenant_not_found' }, { status: 401 });
    }

    // 2. Check suspended/banned status
    if (tenant.status === 'suspended') {
      return NextResponse.json({ valid: false, reason: 'suspended' }, { status: 403 });
    }
    if (tenant.status === 'banned') {
      return NextResponse.json({ valid: false, reason: 'banned' }, { status: 403 });
    }

    // 3. Check if session token exists in ActiveSession table
    if (sessionToken) {
      const activeSession = await prisma.activeSession.findUnique({ where: { id: sessionToken } });
      if (!activeSession) {
        return NextResponse.json({ valid: false, reason: 'logged_out' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ valid: false, reason: 'no_session' }, { status: 401 });
    }

    return NextResponse.json({ valid: true, status: tenant.status });
  } catch (err: any) {
    console.error('Session check error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
