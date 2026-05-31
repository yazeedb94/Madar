import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' }, { status: 400 });
    }

    let settings = await prisma.saaSSetting.findFirst();
    if (!settings) {
      settings = await prisma.saaSSetting.create({
        data: {
          platformName: 'منصتي لترخيص وإدارة الاشتراكات',
          theme: 'dark',
          currency: 'SAR',
          language: 'ar',
          taxes: 15,
          adminEmail: 'admin@saas.com',
          adminPassword: 'admin',
        }
      });
    }

    if (email === settings.adminEmail && password === settings.adminPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة!' }, { status: 401 });
  } catch (err: any) {
    console.error('Super Admin login error:', err);
    return NextResponse.json({ error: 'حدث خطأ في خادم النظام' }, { status: 500 });
  }
}
