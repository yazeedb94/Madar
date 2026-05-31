import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing plan id' }, { status: 400 });
    }
    await prisma.platformPlan.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Platform plan deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting platform plan:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
