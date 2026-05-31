'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  QrCode,
  Bell,
  BarChart3,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { settings, businessConfig, t } = useApp();

  // If not onboarded yet, do not show sidebar
  if (!settings.isOnboarded) return null;

  const links = [
    {
      href: '/dashboard',
      label: t('لوحة التحكم', 'Dashboard'),
      icon: LayoutDashboard,
    },
    {
      href: '/customers',
      label: settings.language === 'ar' ? businessConfig.membersLabel.ar : businessConfig.membersLabel.en,
      icon: Users,
    },
    {
      href: '/subscriptions',
      label: settings.language === 'ar' ? businessConfig.plansLabel.ar : businessConfig.plansLabel.en,
      icon: Shield,
    },
    {
      href: '/attendance',
      label: settings.language === 'ar' ? businessConfig.checkInLabel.ar : businessConfig.checkInLabel.en,
      icon: QrCode,
    },
    {
      href: '/payments',
      label: t('المدفوعات والفواتير', 'Payments & Invoices'),
      icon: CreditCard,
    },
    {
      href: '/notifications',
      label: t('التنبيهات والرسائل', 'Alerts & Messages'),
      icon: Bell,
    },
    {
      href: '/reports',
      label: t('التقارير والإحصائيات', 'Reports & Analytics'),
      icon: BarChart3,
    },
    {
      href: '/settings',
      label: t('الإعدادات العامة', 'General Settings'),
      icon: Settings,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: '1.75rem' }}>{businessConfig.icon}</span>
        <div>
          <div style={{ lineHeight: '1.2' }}>{settings.businessName}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
            {settings.language === 'ar' ? businessConfig.nameAr : businessConfig.nameEn}
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('saas_active_tenant_id');
              localStorage.removeItem('saas_sub_settings');
              localStorage.removeItem('saas_sub_customers');
              localStorage.removeItem('saas_sub_plans');
              localStorage.removeItem('saas_sub_attendance');
              localStorage.removeItem('saas_sub_payments');
              localStorage.removeItem('saas_sub_notifications');
              document.cookie = 'tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              window.location.href = '/login';
            }
          }}
          className="sidebar-link"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'start',
            color: 'var(--danger, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--danger, #ef4444)';
          }}
        >
          <LogOut size={18} />
          <span>{t('تسجيل الخروج', 'Log Out')}</span>
        </button>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
          {t('نظام إدارة الاشتراكات v1.0', 'Subscription System v1.0')}
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
