'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import Sidebar from './Sidebar';
import Header from './Header';
import { restoreTenantData } from '@/lib/store';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, isHydrated, refreshData } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    if (typeof window !== 'undefined') {
      const isSuper = sessionStorage.getItem('is_super_admin_authenticated') === 'true';
      const isImpersonating = sessionStorage.getItem('is_super_admin_impersonating') === 'true';
      const activeTenantId = localStorage.getItem('saas_active_tenant_id');
      
      // If the user has no active tenant context and is not super admin/impersonating, redirect to login
      if (!activeTenantId && !isSuper && !isImpersonating) {
        router.replace('/login');
        return;
      }

      // Prevent empty/uninitialized tenant account access on client side
      if (activeTenantId && !isSuper) {
        const hasSettings = localStorage.getItem('saas_sub_settings');
        if (!hasSettings) {
          restoreTenantData(activeTenantId);
          const restoredSettings = localStorage.getItem('saas_sub_settings');
          
          if (restoredSettings) {
            try {
              const parsed = JSON.parse(restoredSettings);
              if (!parsed.businessName || parsed.businessName.trim() === '') {
                localStorage.removeItem('saas_active_tenant_id');
                document.cookie = 'tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                router.replace('/login');
                return;
              }
            } catch (e) {
              localStorage.removeItem('saas_active_tenant_id');
              document.cookie = 'tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              router.replace('/login');
              return;
            }
            refreshData(); // Hydrate the settings context
          } else {
            localStorage.removeItem('saas_active_tenant_id');
            document.cookie = 'tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            router.replace('/login');
            return;
          }
        } else {
          try {
            const parsed = JSON.parse(hasSettings);
            if (!parsed.businessName || parsed.businessName.trim() === '') {
              localStorage.removeItem('saas_active_tenant_id');
              localStorage.removeItem('saas_sub_settings');
              document.cookie = 'tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              router.replace('/login');
              return;
            }
          } catch (e) {
            localStorage.removeItem('saas_active_tenant_id');
            localStorage.removeItem('saas_sub_settings');
            document.cookie = 'tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            router.replace('/login');
            return;
          }
        }
      }
      if (activeTenantId && !isImpersonating) {
        fetch('/api/auth/session-check')
          .then(res => {
            if (res.status === 401 || res.status === 403) {
              localStorage.removeItem('saas_active_tenant_id');
              document.cookie = 'tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              router.replace('/login');
            }
          })
          .catch(e => console.error('Session validation failed', e));
      }
    }
  }, [pathname, router, isHydrated, refreshData]);

  // Periodic background check of session status (every 15s) for instant lockout
  useEffect(() => {
    if (!isHydrated) return;
    if (typeof window === 'undefined') return;

    const isImpersonating = sessionStorage.getItem('is_super_admin_impersonating') === 'true';
    const activeTenantId = localStorage.getItem('saas_active_tenant_id');

    if (!activeTenantId || isImpersonating) return;

    const checkSessionPeriodically = () => {
      fetch('/api/auth/session-check')
        .then(res => {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('saas_active_tenant_id');
            document.cookie = 'tenant_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            router.replace('/login');
          }
        })
        .catch(e => console.error('Periodic session check failed', e));
    };

    // Run interval
    const intervalId = setInterval(checkSessionPeriodically, 15000);
    return () => clearInterval(intervalId);
  }, [isHydrated, router]);


  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  useEffect(() => {
    // Close mobile sidebar on page change
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isHydrated) return;
    setMounted(true);
  }, [isHydrated]);

  if (!mounted || !isHydrated) {
    return <div className="setup-container" />;
  }

  // If not onboarded, just render the onboarding page
  if (!settings.isOnboarded) {
    return <div className="setup-container">{children}</div>;
  }

  return (
    <div className="app-container">
      {isMobileSidebarOpen && (
        <div 
          className="sidebar-overlay animate-fade-in" 
          onClick={() => setIsMobileSidebarOpen(false)} 
        />
      )}
      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
      <div className="main-content">
        <Header onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};
export default AppShell;
