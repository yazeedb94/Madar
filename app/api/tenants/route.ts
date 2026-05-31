import { NextResponse } from 'next/server';
import { fetchTenants, createTenant, updateTenant, deleteTenant } from '@/lib/store-server';

export async function GET() {
  const tenants = await fetchTenants();
  return NextResponse.json(tenants);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Expected fields: name, type, email, password, currency, plan, language
    const tenant = await createTenant(data);
    return NextResponse.json(tenant);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updates } = data;
    if (!id) {
      return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 });
    }
    const tenant = await updateTenant(id, updates);
    return NextResponse.json(tenant);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing tenant id' }, { status: 400 });
    }
    await deleteTenant(id);
    return NextResponse.json({ message: 'Tenant deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
