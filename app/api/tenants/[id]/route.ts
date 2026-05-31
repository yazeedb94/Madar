import { NextResponse } from 'next/server';
import { updateTenant, deleteTenant } from '@/lib/store-server';
import prisma from '@/prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    let id = resolvedParams?.id;
    if (!id) {
      const { searchParams } = new URL(request.url);
      id = searchParams.get('id') || '';
    }
    if (!id) return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 });

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    return NextResponse.json(tenant);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const pathId = resolvedParams?.id;

    const data = await request.json();
    const id = data.id || pathId;
    if (!id) return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 });

    const { id: _, ...updates } = data;
    const tenant = await updateTenant(id, updates);
    return NextResponse.json(tenant);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    let id = resolvedParams?.id;
    if (!id) {
      const { searchParams } = new URL(request.url);
      id = searchParams.get('id') || '';
    }
    if (!id) return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 });

    await deleteTenant(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
