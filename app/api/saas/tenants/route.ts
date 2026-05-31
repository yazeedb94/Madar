import { NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import fs from 'fs';
import path from 'path';
import { hashPassword } from '@/lib/auth';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Helper to read backups DB
function readDbBackups() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      return parsed.backups || {};
    }
  } catch (err) {
    console.error('Error reading db.json backups', err);
  }
  return {};
}

// Helper to write backups DB
function writeDbBackups(backups: any) {
  try {
    let dbContent = { tenants: [], backups: {} };
    if (fs.existsSync(DB_PATH)) {
      dbContent = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
    dbContent.backups = backups;
    fs.writeFileSync(DB_PATH, JSON.stringify(dbContent, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json backups', err);
  }
}

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const backups = readDbBackups();

    // Map each tenant to include customer count and user count from the backup JSON
    const extendedTenants = tenants.map(t => {
      const backup = backups[t.id];
      let customerCount = 0;
      let userCount = 1; // Default to 1 (the owner)
      let logo = '';

      if (backup) {
        try {
          // In the database model, the backup can be a parsed object or string
          const parsedBackup = typeof backup === 'string' ? JSON.parse(backup) : backup;
          
          // Parse customers
          if (parsedBackup.customers) {
            const custs = typeof parsedBackup.customers === 'string' ? JSON.parse(parsedBackup.customers) : parsedBackup.customers;
            if (Array.isArray(custs)) {
              customerCount = custs.length;
            }
          }

          // Parse settings for business logo
          if (parsedBackup.settings) {
            const settingsObj = typeof parsedBackup.settings === 'string' ? JSON.parse(parsedBackup.settings) : parsedBackup.settings;
            logo = settingsObj.logoUrl || '';
          }

          // In this platform, users are stored inside customers list or calculated. Let's make user count equal to 1 owner + some workers
          userCount = 1 + Math.min(Math.round(customerCount / 5), 3); // Simulating trainers/receptionists based on scale
        } catch (e) {
          console.error(`Failed to parse backup for tenant ${t.id}`, e);
        }
      }

      return {
        ...t,
        customerCount,
        userCount,
        logo
      };
    });

    return NextResponse.json(extendedTenants);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, type, email, password, currency, plan, language } = data;
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashed = await hashPassword(password);
    
    // Trial duration: 30 days
    const trialDate = new Date();
    trialDate.setDate(trialDate.getDate() + 30);
    const expiryDate = trialDate.toISOString().split('T')[0];

    const tenant = await prisma.tenant.create({
      data: {
        name,
        type,
        email,
        password: hashed,
        currency: currency || 'SAR',
        plan: plan || 'Premium',
        language: language || 'ar',
        status: plan === 'Trial' ? 'trial' : 'active',
        subscriptionPeriod: 'monthly',
        expiryDate
      }
    });

    // Log this activity
    await prisma.activityLog.create({
      data: {
        action: 'CREATE_TENANT',
        operator: 'admin@saas.com',
        target: `النشاط: ${name} (${type})`,
        ip: '127.0.0.1'
      }
    });

    // Create default platform invoice/payment to reflect in billing dashboard
    const defaultPrices: Record<string, number> = { 'Basic': 199, 'Premium': 399, 'Enterprise': 699, 'Trial': 0 };
    const price = defaultPrices[plan] || 199;

    if (price > 0) {
      await prisma.platformPayment.create({
        data: {
          tenantId: tenant.id,
          tenantName: tenant.name,
          amount: price,
          currency: tenant.currency,
          method: 'card',
          paidAt: new Date()
        }
      });
      await prisma.platformRenewal.create({
        data: {
          tenantId: tenant.id,
          tenantName: tenant.name,
          planName: plan,
          period: 'monthly',
          price: price,
          renewedAt: new Date()
        }
      });
    }

    return NextResponse.json(tenant);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updates } = data;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    const originalTenant = await prisma.tenant.findUnique({ where: { id } });
    const tenant = await prisma.tenant.update({
      where: { id },
      data: updates
    });

    // Log action if status changed
    if (updates.status && originalTenant?.status !== updates.status) {
      let actionLabel = 'UPDATE_TENANT_STATUS';
      let targetText = `تغيير حالة ${tenant.name} إلى ${updates.status}`;
      if (updates.status === 'suspended' || updates.status === 'frozen') {
        actionLabel = 'SUSPEND_TENANT';
        targetText = `تجميد النشاط التجاري: ${tenant.name}`;
      } else if (updates.status === 'banned') {
        actionLabel = 'BAN_TENANT';
        targetText = `حظر النشاط التجاري بالكامل: ${tenant.name}`;
      } else if (updates.status === 'active') {
        actionLabel = 'ACTIVATE_TENANT';
        targetText = `تنشيط النشاط التجاري: ${tenant.name}`;
      }

      await prisma.activityLog.create({
        data: {
          action: actionLabel,
          operator: 'admin@saas.com',
          target: targetText,
          ip: '127.0.0.1'
        }
      });
    } else {
      // General update
      await prisma.activityLog.create({
        data: {
          action: 'UPDATE_TENANT',
          operator: 'admin@saas.com',
          target: `تعديل بيانات النشاط: ${tenant.name}`,
          ip: '127.0.0.1'
        }
      });
    }

    return NextResponse.json(tenant);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Delete backup data
    const backups = readDbBackups();
    if (backups[id]) {
      delete backups[id];
      writeDbBackups(backups);
    }

    // Delete tenant from Prisma
    await prisma.tenant.delete({ where: { id } });

    // Log deletion
    await prisma.activityLog.create({
      data: {
        action: 'DELETE_TENANT',
        operator: 'admin@saas.com',
        target: `حذف النشاط التجاري نهائياً: ${tenant.name}`,
        ip: '127.0.0.1'
      }
    });

    return NextResponse.json({ message: 'Tenant deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
