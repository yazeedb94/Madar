import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export async function POST(request: Request) {
  try {
    const { title, message, type } = await request.json();
    
    if (!title || !message || !type) {
      return NextResponse.json({ error: 'Missing title, message or type' }, { status: 400 });
    }

    const tenants = await prisma.tenant.findMany({
      where: { status: 'active' }
    });

    // 1. Create SQLite notifications for each active tenant
    const createdNotifications = [];
    for (const t of tenants) {
      const notif = await prisma.notification.create({
        data: {
          tenantId: t.id,
          title: `[إشعار ${type === 'maintenance' ? 'صيانة' : 'تحديث'}] ${title}`,
          message,
          read: false
        }
      });
      createdNotifications.push(notif);
    }

    // 2. Inject into data/db.json backups for each tenant so it's fully synced in client localstorage backups
    if (fs.existsSync(DB_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        const dbContent = JSON.parse(fileContent);
        const backups = dbContent.backups || {};

        for (const t of tenants) {
          const backup = backups[t.id];
          if (backup) {
            const parsedBackup = typeof backup === 'string' ? JSON.parse(backup) : backup;
            const notifs = parsedBackup.notifications ? (typeof parsedBackup.notifications === 'string' ? JSON.parse(parsedBackup.notifications) : parsedBackup.notifications) : [];
            
            notifs.push({
              id: `BROADCAST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              title: `[إشعار ${type === 'maintenance' ? 'صيانة' : 'تحديث'}] ${title}`,
              message,
              read: false,
              createdAt: new Date().toISOString()
            });

            parsedBackup.notifications = JSON.stringify(notifs);
            backups[t.id] = parsedBackup;
          }
        }

        dbContent.backups = backups;
        fs.writeFileSync(DB_PATH, JSON.stringify(dbContent, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to inject notifications in db.json backups', err);
      }
    }

    // 3. Log broadcast action in general Activity Logs
    await prisma.activityLog.create({
      data: {
        action: 'SEND_BROADCAST_NOTIFICATION',
        operator: 'admin@saas.com',
        target: `إرسال إشعار جماعي [${type}]: ${title} (إلى ${tenants.length} منشأة)`,
        ip: '127.0.0.1'
      }
    });

    return NextResponse.json({ success: true, count: tenants.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
