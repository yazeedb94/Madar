'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { getNotifications } from '@/lib/store';
import { Sun, Moon, Languages, Bell, User, Menu } from 'lucide-react';
import Link from 'next/link';

export const Header: React.FC<{ onMenuToggle?: () => void }> = ({ onMenuToggle }) => {
  const { settings, theme, setTheme, language, setLanguage, t, triggerCount } = useApp();
  
  // Calculate unread notifications
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const notifications = getNotifications();
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    }
  }, [triggerCount]);

  if (!settings.isOnboarded) return null;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const [isImpersonating, setIsImpersonating] = React.useState(false);
  const [impersonatingTenantName, setImpersonatingTenantName] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsImpersonating(sessionStorage.getItem('is_super_admin_impersonating') === 'true');
      setImpersonatingTenantName(sessionStorage.getItem('super_admin_impersonating_tenant_name') || '');
    }
  }, [triggerCount]);

  const handleReturnToAdmin = () => {
    sessionStorage.removeItem('is_super_admin_impersonating');
    sessionStorage.removeItem('super_admin_impersonating_tenant_name');
    window.location.href = '/super-admin';
  };

  return (
    <>
      {isImpersonating && (
        <div style={{
          backgroundColor: '#eab308',
          color: '#0f0f17',
          padding: '0.5rem 1.5rem',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠️ أنت تتصفح النظام حالياً كمسؤول للمنصة مستكشفاً حساب:</span>
            <span style={{ textDecoration: 'underline' }}>{impersonatingTenantName || settings.businessName}</span>
          </div>
          <button 
            onClick={handleReturnToAdmin}
            style={{ 
              fontSize: '0.75rem', 
              padding: '0.35rem 0.75rem', 
              backgroundColor: '#0f0f17', 
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            العودة إلى لوحة الإدارة العامة
          </button>
        </div>
      )}
      <header className="header" style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {onMenuToggle && (
          <button 
            className="btn btn-secondary btn-icon mobile-menu-btn" 
            onClick={onMenuToggle}
            title={t('القائمة', 'Menu')}
          >
            <Menu size={18} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }} className="mobile-hide-welcome">
            {t('مرحباً بك في ', 'Welcome to ')}
          </span>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
            {settings.businessName}
          </span>
        </div>
      </div>

      <div className="header-actions">
        {/* Language Toggle */}
        <button 
          className="btn btn-secondary btn-icon" 
          onClick={toggleLanguage}
          title={t('تغيير اللغة', 'Change Language')}
        >
          <Languages size={18} />
        </button>

        {/* Theme Toggle */}
        <button 
          className="btn btn-secondary btn-icon" 
          onClick={toggleTheme}
          title={t('تغيير المظهر', 'Toggle Theme')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Icon */}
        <Link href="/notifications" style={{ position: 'relative' }}>
          <button className="btn btn-secondary btn-icon" title={t('التنبيهات', 'Notifications')}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: 'var(--danger)',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                boxShadow: '0 0 5px rgba(239, 68, 68, 0.5)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        </Link>

        {/* User Profile Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          paddingInlineStart: '0.75rem',
          borderInlineStart: '1px solid var(--border-color)'
        }}>
          <div className="flex-center" style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)'
          }}>
            <User size={18} />
          </div>
          <div style={{ display: 'none', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>المدير</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Admin</span>
          </div>
        </div>
      </div>
    </header>
    </>
  );
};
export default Header;
