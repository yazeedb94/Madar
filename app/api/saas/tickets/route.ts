import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';

export async function GET() {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Seed typical demo tickets if empty
    if (tickets.length === 0) {
      const tenants = await prisma.tenant.findMany();
      const mockTickets = [
        {
          tenantId: tenants[0]?.id || 'mock-id',
          tenantName: tenants[0]?.name || 'نادي القوة البدنية',
          type: 'problem',
          subject: 'مشكلة في تحميل ملف Excel للمشتركين',
          description: 'عند استيراد ملف المشتركين المرفق يظهر خطأ في تنسيق التواريخ ولا يكتمل الاستيراد.',
          status: 'open',
          priority: 'high',
        },
        {
          tenantId: tenants[0]?.id || 'mock-id',
          tenantName: tenants[0]?.name || 'نادي القوة البدنية',
          type: 'request',
          subject: 'طلب تمديد فترة التجربة المجانية',
          description: 'نحن بحاجة إلى 5 أيام إضافية لاختبار ميزة تحضير المشتركين عبر الباركود قبل الاشتراك المدفوع.',
          status: 'in_progress',
          priority: 'medium',
        },
        {
          tenantId: tenants[0]?.id || 'mock-id',
          tenantName: tenants[0]?.name || 'صالون اللمسة الجميلة',
          type: 'complaint',
          subject: 'بطء ملحوظ في تحديث الحضور المباشر',
          description: 'تأخذ عملية تسجيل الحضور بالباركود ما يقارب 5 ثواني للظهور في لوحة التحكم الرئيسية.',
          status: 'resolved',
          priority: 'low',
          reply: 'تم تحسين أداء استعلامات الحضور المباشر وزيادة سرعة الاستجابة إلى أقل من 200 جزء من الثانية. شكراً لكِ!'
        }
      ];

      for (const t of mockTickets) {
        await prisma.supportTicket.create({ data: t });
      }

      const freshTickets = await prisma.supportTicket.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(freshTickets);
    }

    return NextResponse.json(tickets);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { tenantId, tenantName, type, subject, description, priority } = data;
    
    if (!tenantName || !type || !subject || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId,
        tenantName,
        type,
        subject,
        description,
        priority: priority || 'medium',
        status: 'open'
      }
    });

    return NextResponse.json(ticket);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, reply, status, priority } = data;

    if (!id) {
      return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });
    }

    const updateData: any = {};
    if (reply !== undefined) updateData.reply = reply;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: updateData
    });

    // Add activity log for solving ticket
    if (status === 'resolved') {
      await prisma.activityLog.create({
        data: {
          action: 'RESOLVE_TICKET',
          operator: 'admin@saas.com',
          target: `حل التذكرة #${ticket.id.slice(0, 8)}: ${ticket.subject}`,
          ip: '127.0.0.1'
        }
      });
    }

    return NextResponse.json(ticket);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });
    }

    await prisma.supportTicket.delete({ where: { id } });
    return NextResponse.json({ message: 'Ticket deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
