import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { comparePassword } from '@/lib/auth';

/**
 * POST /api/auth/verify-password
 * Body: { tenantId: string, password: string }
 *
 * Verifies the current password for a tenant without performing a full login.
 * Used by the settings page to confirm identity before allowing a password change.
 */
export async function POST(request: Request) {
  try {
    const { tenantId, password } = await request.json();

    if (!tenantId || !password) {
      return NextResponse.json({ error: 'Missing tenantId or password' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const matches = await comparePassword(password, tenant.password);
    if (!matches) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error('verify-password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
