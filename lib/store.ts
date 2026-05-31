// lib/store.ts

import type { Tenant as PrismaTenant } from '@prisma/client';

// Exported type for tenant (extended to support frontend client properties)
export type Tenant = PrismaTenant & {
  theme?: string;
  isOnboarded?: boolean;
};

/** Client‑side: Get all tenants from sessionStorage */
export const getTenants = (): Tenant[] => {
  if (typeof window !== 'undefined') {
    const data = sessionStorage.getItem('tenants');
    return data ? JSON.parse(data) : [];
  }
  return [];
};

/** Client‑side: Save tenants to sessionStorage */
export const saveTenants = (tenants: Tenant[]): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('tenants', JSON.stringify(tenants));
  }
};

/** Settings interface for application configuration */
export type Settings = {
  businessName: string;
  businessType: string; // e.g., 'gym', 'custom', etc.
  currency: string;
  language: 'ar' | 'en';
  theme: 'dark' | 'light';
  isOnboarded: boolean;
};

/** Retrieve settings from localStorage (client side) */
export const getSettings = (): Settings => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('saas_sub_settings');
    if (data) {
      try {
        return JSON.parse(data) as Settings;
      } catch (e) {
        console.error('Failed to parse settings from localStorage', e);
      }
    }
  }
  // Default fallback settings
  return {
    businessName: '',
    businessType: 'custom',
    currency: 'SAR',
    language: 'ar',
    theme: 'dark',
    isOnboarded: true,
  };
};

/** Persist settings to localStorage (client side) */
export const saveSettings = (settings: Settings): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('saas_sub_settings', JSON.stringify(settings));
    autoBackupTenantData();
  }
};

/** Client‑side: Switch active tenant context (cookie) */
export const switchTenantContext = (tenantId: string) => {
  if (typeof window !== 'undefined') {
    document.cookie = `tenant_id=${tenantId}; path=/; max-age=${60 * 60 * 24}`;
  }
};

/* --- Client-Side LocalStorage Database Implementation for Tenants data --- */

// Customers
export const getCustomers = (): any[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('saas_sub_customers');
    return data ? JSON.parse(data) : [];
  }
  return [];
};

export const saveCustomer = (customer: any): void => {
  if (typeof window !== 'undefined') {
    const list = getCustomers();
    const idx = list.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      list[idx] = customer;
    } else {
      list.push(customer);
    }
    localStorage.setItem('saas_sub_customers', JSON.stringify(list));
    autoBackupTenantData();
  }
};

export const deleteCustomer = (id: string): void => {
  if (typeof window !== 'undefined') {
    const list = getCustomers();
    const filtered = list.filter(c => c.id !== id);
    localStorage.setItem('saas_sub_customers', JSON.stringify(filtered));
    autoBackupTenantData();
  }
};

// Plans
export const getPlans = (): any[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('saas_sub_plans');
    return data ? JSON.parse(data) : [];
  }
  return [];
};

export const savePlan = (plan: any): void => {
  if (typeof window !== 'undefined') {
    const list = getPlans();
    const idx = list.findIndex(p => p.id === plan.id);
    if (idx >= 0) {
      list[idx] = plan;
    } else {
      list.push(plan);
    }
    localStorage.setItem('saas_sub_plans', JSON.stringify(list));
    autoBackupTenantData();
  }
};

export const deletePlan = (id: string): void => {
  if (typeof window !== 'undefined') {
    const list = getPlans();
    const filtered = list.filter(p => p.id !== id);
    localStorage.setItem('saas_sub_plans', JSON.stringify(filtered));
    autoBackupTenantData();
  }
};

// Payments
export const getPayments = (): any[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('saas_sub_payments');
    return data ? JSON.parse(data) : [];
  }
  return [];
};

export const savePayment = (payment: any): void => {
  if (typeof window !== 'undefined') {
    const list = getPayments();
    const idx = list.findIndex(p => p.id === payment.id);
    if (idx >= 0) {
      list[idx] = payment;
    } else {
      list.push(payment);
    }
    localStorage.setItem('saas_sub_payments', JSON.stringify(list));
    autoBackupTenantData();
  }
};

// Attendance
export const getAttendance = (): any[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('saas_sub_attendance');
    return data ? JSON.parse(data) : [];
  }
  return [];
};

export const saveAttendance = (attendance: any): void => {
  if (typeof window !== 'undefined') {
    const list = getAttendance();
    const idx = list.findIndex(a => a.id === attendance.id);
    if (idx >= 0) {
      list[idx] = attendance;
    } else {
      list.push(attendance);
    }
    localStorage.setItem('saas_sub_attendance', JSON.stringify(list));
    autoBackupTenantData();
  }
};

// Notifications
export const getNotifications = (): any[] => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('saas_sub_notifications');
    return data ? JSON.parse(data) : [];
  }
  return [];
};

export const saveNotifications = (notifications: any[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('saas_sub_notifications', JSON.stringify(notifications));
    autoBackupTenantData();
  }
};

export const markNotificationRead = (id: string): void => {
  if (typeof window !== 'undefined') {
    const list = getNotifications();
    const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
  }
};

/**
 * Push a new notification into localStorage.
 *
 * Deduplication rule:
 *   One notification per (customerId + type) per calendar day.
 *   Ignores read/unread status — a new entry is only allowed once
 *   the calendar day changes (i.e. every 24 h at midnight).
 */
export const pushNotification = (notif: {
  type: 'expiring' | 'expired' | 'payment' | 'welcome' | 'freeze';
  title: string;
  message: string;
  customerId?: string;
}): void => {
  if (typeof window === 'undefined') return;
  const list = getNotifications();

  const todayKey = new Date().toISOString().split('T')[0]; // e.g. "2026-05-29"

  // Deduplicate: skip if a notification for same customer+type already exists TODAY
  const alreadyToday = list.some(n => {
    const notifDay = (n.createdAt || '').split('T')[0];
    return n.customerId === notif.customerId &&
           n.type === notif.type &&
           notifDay === todayKey;
  });
  if (alreadyToday) return;

  const newNotif = {
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    ...notif,
    read: false,
    createdAt: new Date().toISOString(),
  };

  saveNotifications([newNotif, ...list]);
};


/**
 * Remove duplicate notifications: keep only the latest per (customerId+type+day).
 * Call once on app load or when the notifications page mounts.
 */
export const deduplicateNotifications = (): void => {
  if (typeof window === 'undefined') return;
  const list = getNotifications();
  const seen = new Set<string>();
  const deduped: any[] = [];

  // Sort newest first so we keep the latest entry for each key
  const sorted = [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  sorted.forEach(n => {
    const day = (n.createdAt || '').split('T')[0];
    const key = `${n.customerId ?? 'sys'}_${n.type}_${day}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(n);
    }
  });

  // Restore chronological order (newest first)
  saveNotifications(deduped);
};



export const seedDatabase = (type: string, name: string, currency: string) => {
  if (typeof window !== 'undefined') {
    // 1. Settings
    const settingsObj: Settings = {
      businessName: name,
      businessType: type,
      currency: currency,
      language: 'ar',
      theme: 'dark',
      isOnboarded: true,
    };
    localStorage.setItem('saas_sub_settings', JSON.stringify(settingsObj));

    // 2. Default Plans based on some generic choices
    const defaultPlans = [
      {
        id: 'PLAN-1',
        name: 'الاشتراك الأساسي (شهر)',
        nameEn: 'Basic Membership (1 Month)',
        price: type === 'clinic' ? 50 : 150,
        duration: 1,
        durationType: 'months',
        isActive: true,
        description: 'دخول عادي للمرافق والاستفادة من الخدمات الأساسية',
      },
      {
        id: 'PLAN-2',
        name: 'الاشتراك الفضي (3 أشهر)',
        nameEn: 'Silver Membership (3 Months)',
        price: type === 'clinic' ? 120 : 350,
        duration: 3,
        durationType: 'months',
        isActive: true,
        description: 'دخول كامل + بعض الميزات والخدمات المتوسطة المتقدمة',
      },
      {
        id: 'PLAN-3',
        name: 'الاشتراك البلاتيني (سنة كاملة)',
        nameEn: 'Platinum Membership (1 Year)',
        price: type === 'clinic' ? 400 : 1000,
        duration: 1,
        durationType: 'years',
        isActive: true,
        description: 'اشتراك سنوي شامل لكافة الميزات والخدمات بلا حدود',
      },
    ];
    localStorage.setItem('saas_sub_plans', JSON.stringify(defaultPlans));

    // 3. Clear/initialize empty collections
    localStorage.setItem('saas_sub_customers', JSON.stringify([]));
    localStorage.setItem('saas_sub_attendance', JSON.stringify([]));
    localStorage.setItem('saas_sub_payments', JSON.stringify([]));
    localStorage.setItem('saas_sub_notifications', JSON.stringify([]));
    autoBackupTenantData();
  }
};

export const backupTenantData = (tenantId: string) => {
  if (typeof window !== 'undefined') {
    const backup = {
      settings: localStorage.getItem('saas_sub_settings'),
      customers: localStorage.getItem('saas_sub_customers'),
      plans: localStorage.getItem('saas_sub_plans'),
      attendance: localStorage.getItem('saas_sub_attendance'),
      payments: localStorage.getItem('saas_sub_payments'),
      notifications: localStorage.getItem('saas_sub_notifications'),
    };
    localStorage.setItem(`saas_tenant_backup_${tenantId}`, JSON.stringify(backup));
  }
};

export const restoreTenantData = (tenantId: string) => {
  if (typeof window !== 'undefined') {
    const backupStr = localStorage.getItem(`saas_tenant_backup_${tenantId}`);
    if (backupStr) {
      try {
        const backup = JSON.parse(backupStr);
        if (backup.settings) localStorage.setItem('saas_sub_settings', backup.settings);
        else localStorage.removeItem('saas_sub_settings');

        if (backup.customers) localStorage.setItem('saas_sub_customers', backup.customers);
        else localStorage.removeItem('saas_sub_customers');

        if (backup.plans) localStorage.setItem('saas_sub_plans', backup.plans);
        else localStorage.removeItem('saas_sub_plans');

        if (backup.attendance) localStorage.setItem('saas_sub_attendance', backup.attendance);
        else localStorage.removeItem('saas_sub_attendance');

        if (backup.payments) localStorage.setItem('saas_sub_payments', backup.payments);
        else localStorage.removeItem('saas_sub_payments');

        if (backup.notifications) localStorage.setItem('saas_sub_notifications', backup.notifications);
        else localStorage.removeItem('saas_sub_notifications');
      } catch (err) {
        console.error('Error restoring tenant backup data', err);
      }
    } else {
      // Clear data to prevent leakage from other tenants
      localStorage.removeItem('saas_sub_settings');
      localStorage.removeItem('saas_sub_customers');
      localStorage.removeItem('saas_sub_plans');
      localStorage.removeItem('saas_sub_attendance');
      localStorage.removeItem('saas_sub_payments');
      localStorage.removeItem('saas_sub_notifications');
    }
  }
};

/** Asynchronously sync all tenant backups from localStorage to the server data/db.json */
export const syncWithServer = async (tenantId: string) => {
  if (typeof window === 'undefined') return;
  const backupStr = localStorage.getItem(`saas_tenant_backup_${tenantId}`);
  if (!backupStr) return;
  try {
    const backup = JSON.parse(backupStr);
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backups: {
          [tenantId]: backup
        }
      })
    });
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('saas_active_tenant_id');
      document.cookie = 'tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  } catch (err) {
    console.error('Failed to sync tenant backup to server:', err);
  }
};

/** Fetch backups from the server and populate localStorage */
export const pullServerBackups = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  // Guard: Only pull backups if there is an active tenant context to avoid unauthenticated loops
  const activeTenantId = localStorage.getItem('saas_active_tenant_id');
  if (!activeTenantId) return false;

  try {
    const res = await fetch('/api/sync');
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('saas_active_tenant_id');
      document.cookie = 'tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return false;
    }
    if (!res.ok) return false;
    const db = await res.json();
    if (db && db.backups) {
      let updated = false;
      Object.entries(db.backups).forEach(([tenantId, backup]: [string, any]) => {
        const localBackupKey = `saas_tenant_backup_${tenantId}`;
        const localBackup = localStorage.getItem(localBackupKey);
        const serverBackupStr = JSON.stringify(backup);
        if (localBackup !== serverBackupStr) {
          localStorage.setItem(localBackupKey, serverBackupStr);
          updated = true;
        }
      });
      
      const activeId = localStorage.getItem('saas_active_tenant_id');
      if (activeId && updated) {
        restoreTenantData(activeId);
        return true;
      }
    }
  } catch (err) {
    console.error('Failed to pull server backups:', err);
  }
  return false;
};

/** Auto backup current active tenant standard keys to their isolated backup space and sync to server */
export const autoBackupTenantData = () => {
  if (typeof window === 'undefined') return;
  const activeTenantId = localStorage.getItem('saas_active_tenant_id');
  if (activeTenantId) {
    backupTenantData(activeTenantId);
    syncWithServer(activeTenantId);
  }
};
