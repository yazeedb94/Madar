import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';

export async function GET() {
  try {
    const plans = await prisma.platformPlan.findMany({
      orderBy: { price: 'asc' }
    });
    return NextResponse.json(plans);
  } catch (err: any) {
    console.error('Error fetching platform plans:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, price, period, currency, features } = await request.json();
    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields (name, price)' }, { status: 400 });
    }
    const plan = await prisma.platformPlan.create({
      data: {
        name,
        price: parseFloat(price),
        period: period || 'monthly',
        currency: currency || 'SAR',
        features: features || '',
      }
    });
    return NextResponse.json(plan);
  } catch (err: any) {
    console.error('Error creating platform plan:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name, price, period, currency, features } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing plan id' }, { status: 400 });
    }
    const plan = await prisma.platformPlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(period !== undefined && { period }),
        ...(currency !== undefined && { currency }),
        ...(features !== undefined && { features }),
      }
    });
    return NextResponse.json(plan);
  } catch (err: any) {
    console.error('Error updating platform plan:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
