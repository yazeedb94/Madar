import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { comparePassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { email } });
    if (!tenant) {
      return NextResponse.json({ error: 'Email not found' }, { status: 401 });
    }

    // 1. Check suspended/banned status
    if (tenant.status === 'suspended') {
      return NextResponse.json({ 
        error: 'تم تعليق حساب هذا النشاط التجاري، يرجى التواصل مع إدارة المنصة لتفعيل الاشتراك.' 
      }, { status: 403 });
    }

    if (tenant.status === 'banned') {
      return NextResponse.json({ 
        error: 'لقد تم حظر حساب هذا النشاط التجاري لمخالفة شروط الخدمة، يرجى التواصل مع الدعم الفني.' 
      }, { status: 403 });
    }

    // 2. Check subscription expiration date
    if (tenant.expiryDate) {
      const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
      if (tenant.expiryDate < todayStr) {
        return NextResponse.json({ 
          error: 'انتهت صلاحية اشتراك هذا النشاط التجاري، يرجى التواصل مع إدارة المنصة لتجديد الاشتراك.' 
        }, { status: 403 });
      }
    }

    const passwordMatches = await comparePassword(password, tenant.password);
    if (!passwordMatches) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate a unique session token
    const sessionToken = crypto.randomUUID();

    // Save session in SQLite ActiveSession table
    await prisma.activeSession.create({
      data: {
        id: sessionToken,
        userId: tenant.id.toString(),
        email: tenant.email,
        role: 'tenant',
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    });

    const response = NextResponse.json({
      message: 'Login successful',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        type: tenant.type,
        currency: tenant.currency,
        plan: tenant.plan,
        language: tenant.language,
        status: tenant.status
      }
    });

    // Set tenant cookies (both tenant_id and session_token)
    response.cookies.set({
      name: 'tenant_id',
      value: tenant.id.toString(),
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });
    
    response.cookies.set({
      name: 'session_token',
      value: sessionToken,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
