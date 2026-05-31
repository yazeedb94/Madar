import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';

export async function GET() {
  try {
    const logs = await prisma.supportLog.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Seed logs if database is empty
    if (logs.length === 0) {
      const mockLogs = [
        {
          type: 'problem',
          title: 'عطل في خادم استيراد ملفات Excel الكبيرة',
          content: 'تم رصد حدوث Timeout بنسبة 20% عند قيام الأنشطة باستيراد ملفات تحتوي على أكثر من 500 مشترك في وقت واحد بسبب استهلاك الذاكرة المؤقتة.'
        },
        {
          type: 'solution',
          title: 'حل عطل خادم استيراد Excel عن طريق Chunking',
          content: 'تم تقسيم معالجة ملفات Excel المرفوعة إلى دفعات (Chunks) بحد أقصى 100 مشترك لكل دفعة، مع تفعيل المعالجة غير المتزامنة لضمان عدم توقف الطلب الرئيسي.'
        },
        {
          type: 'problem',
          title: 'ظهور شاشة بيضاء عند الدخول من متصفحات Safari القديمة',
          content: 'الأنشطة التي تستخدم متصفحات Safari بنسخ أقدم من 14 تظهر لها شاشة بيضاء بسبب عدم دعم بعض توابع ESNext في الـ bundle.'
        },
        {
          type: 'solution',
          title: 'حل مشكلة Safari القديم بإضافة Polyfills وتعديل Babel config',
          content: 'تم إدراج core-js polyfills وإعادة تكوين Babel لضمان توافقية البناء النهائي مع المتصفحات القديمة بنسبة 100%.'
        }
      ];

      for (const log of mockLogs) {
        await prisma.supportLog.create({ data: log });
      }

      const freshLogs = await prisma.supportLog.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(freshLogs);
    }

    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { type, title, content } = await request.json();
    if (!type || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const log = await prisma.supportLog.create({
      data: { type, title, content }
    });

    await prisma.activityLog.create({
      data: {
        action: type === 'problem' ? 'CREATE_PROBLEM_LOG' : 'CREATE_SOLUTION_LOG',
        operator: 'admin@saas.com',
        target: `إضافة سجل جديد: ${title}`,
        ip: '127.0.0.1'
      }
    });

    return NextResponse.json(log);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
