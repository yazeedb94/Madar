import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';

export async function GET() {
  try {
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

    // Omit password from standard settings fetch for safety
    const { adminPassword, ...safeSettings } = settings;
    return NextResponse.json(safeSettings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
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

    const { platformName, logoUrl, theme, currency, language, taxes, adminEmail, currentPassword, newPassword } = data;
    
    const updates: any = {};
    if (platformName !== undefined) updates.platformName = platformName;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    if (theme !== undefined) updates.theme = theme;
    if (currency !== undefined) updates.currency = currency;
    if (language !== undefined) updates.language = language;
    if (taxes !== undefined) updates.taxes = parseFloat(taxes.toString());
    if (adminEmail !== undefined) updates.adminEmail = adminEmail;

    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        return NextResponse.json({ error: 'الرجاء إدخال كلمة المرور الحالية لتأكيد الهوية!' }, { status: 400 });
      }
      if (currentPassword !== settings.adminPassword) {
        return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة!' }, { status: 400 });
      }
      updates.adminPassword = newPassword;
    }

    const updatedSettings = await prisma.saaSSetting.update({
      where: { id: settings.id },
      data: updates
    });

    // Log the configuration changes
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE_PLATFORM_SETTINGS',
        operator: 'admin@saas.com',
        target: 'تحديث الإعدادات العامة للمنصة وبيانات المسؤول',
        ip: '127.0.0.1'
      }
    });

    const { adminPassword: p, ...safeSettings } = updatedSettings;
    return NextResponse.json(safeSettings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
