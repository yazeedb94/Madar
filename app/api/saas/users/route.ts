import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Map tenants to user/owner objects
    const owners = tenants.map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      status: t.status, // active, suspended, banned, trial
      createdAt: t.createdAt,
      plan: t.plan,
      isEmailVerified: true // Mocked verified for simplicity
    }));

    return NextResponse.json(owners);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, action, newPassword } = await request.json();
    
    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: userId } });
    if (!tenant) {
      return NextResponse.json({ error: 'User/Tenant not found' }, { status: 404 });
    }

    let updatedTenant;

    if (action === 'suspend') {
      updatedTenant = await prisma.tenant.update({
        where: { id: userId },
        data: { status: 'suspended' }
      });
      await prisma.activityLog.create({
        data: {
          action: 'SUSPEND_USER',
          operator: 'admin@saas.com',
          target: `تعليق حساب المالك: ${tenant.email} (${tenant.name})`,
          ip: '127.0.0.1'
        }
      });
    } else if (action === 'ban') {
      updatedTenant = await prisma.tenant.update({
        where: { id: userId },
        data: { status: 'banned' }
      });
      await prisma.activityLog.create({
        data: {
          action: 'BAN_USER',
          operator: 'admin@saas.com',
          target: `حظر حساب المالك: ${tenant.email} (${tenant.name})`,
          ip: '127.0.0.1'
        }
      });
    } else if (action === 'activate') {
      updatedTenant = await prisma.tenant.update({
        where: { id: userId },
        data: { status: 'active' }
      });
      await prisma.activityLog.create({
        data: {
          action: 'ACTIVATE_USER',
          operator: 'admin@saas.com',
          target: `تنشيط حساب المالك: ${tenant.email} (${tenant.name})`,
          ip: '127.0.0.1'
        }
      });
    } else if (action === 'reset_password') {
      if (!newPassword) {
        return NextResponse.json({ error: 'Missing new password' }, { status: 400 });
      }
      const hashed = await hashPassword(newPassword);
      updatedTenant = await prisma.tenant.update({
        where: { id: userId },
        data: { password: hashed }
      });
      await prisma.activityLog.create({
        data: {
          action: 'RESET_PASSWORD',
          operator: 'admin@saas.com',
          target: `إعادة تعيين كلمة مرور المالك: ${tenant.email} (${tenant.name})`,
          ip: '127.0.0.1'
        }
      });
    } else if (action === 'verify_email') {
      // Mock verify
      await prisma.activityLog.create({
        data: {
          action: 'VERIFY_EMAIL',
          operator: 'admin@saas.com',
          target: `تأكيد البريد الإلكتروني للمالك: ${tenant.email}`,
          ip: '127.0.0.1'
        }
      });
    } else if (action === 'force_logout') {
      // Delete active sessions for this user
      await prisma.activeSession.deleteMany({
        where: { email: tenant.email }
      });
      await prisma.activityLog.create({
        data: {
          action: 'FORCE_LOGOUT',
          operator: 'admin@saas.com',
          target: `طرد وإنهاء كافة جلسات المالك: ${tenant.email}`,
          ip: '127.0.0.1'
        }
      });
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: updatedTenant || tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
