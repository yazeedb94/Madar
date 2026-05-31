import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';

export async function GET() {
  try {
    const sessions = await prisma.activeSession.findMany({
      orderBy: { lastActive: 'desc' }
    });

    // Mock security settings (saved in memory or standard defaults)
    const securitySettings = {
      twoFactorEnabled: true,
      suspiciousLoginDetection: true,
      ipRestrictions: false,
      allowedIPs: '192.168.1.1, 127.0.0.1'
    };

    return NextResponse.json({
      settings: securitySettings,
      sessions
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { feature, enabled } = await request.json();
    if (!feature) {
      return NextResponse.json({ error: 'Missing feature name' }, { status: 400 });
    }

    // Log security settings change
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE_SECURITY_SETTING',
        operator: 'admin@saas.com',
        target: `تعديل ميزة الأمان [${feature}] إلى [${enabled ? 'مفعّل' : 'معطّل'}]`,
        ip: '127.0.0.1'
      }
    });

    return NextResponse.json({ success: true, feature, enabled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    const session = await prisma.activeSession.findUnique({ where: { id } });
    if (session) {
      await prisma.activeSession.delete({ where: { id } });
      await prisma.activityLog.create({
        data: {
          action: 'TERMINATE_SESSION',
          operator: 'admin@saas.com',
          target: `إنهاء جلسة نشطة للمستخدم: ${session.email} (IP: ${session.ip})`,
          ip: '127.0.0.1'
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Session terminated' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
