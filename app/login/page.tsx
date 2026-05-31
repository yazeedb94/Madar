'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Key, AlertCircle, Check } from 'lucide-react';
import { restoreTenantData, switchTenantContext, seedDatabase, pullServerBackups } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'خطأ في تسجيل الدخول');
        return;
      }

      // Restore tenant database & settings context on client side
      if (typeof window !== 'undefined' && result.tenant) {
        const tenantId = result.tenant.id;
        
        // 1. Set active tenant context pointer in localStorage
        localStorage.setItem('saas_active_tenant_id', tenantId);
        
        // 2. Set tenant cookies
        switchTenantContext(tenantId);
        
        // 3. Pull latest backups from server FIRST (so we get server-persisted data)
        await pullServerBackups();

        // 4. Restore tenant's isolated data (from local backup or server-synced backup)
        restoreTenantData(tenantId);
        
        // 5. Seed database with defaults if it's a new business with no settings at all
        const currentSettings = localStorage.getItem('saas_sub_settings');
        if (!currentSettings) {
          seedDatabase(result.tenant.type, result.tenant.name, result.tenant.currency);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('خطأ غير متوقع');
    }
  };

  if (!mounted) {
    return <div className="setup-container" />;
  }

  return (
    <div className="setup-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090e', direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
      <div className="setup-card animate-fade-in" style={{ maxWidth: '480px', width: '90%', border: '1px solid rgba(99, 102, 241, 0.15)', boxShadow: '0 12px 40px rgba(99, 102, 241, 0.05)', backgroundColor: '#12121a' }}>
        <div className="text-center mb-3">
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Lock size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>تسجيل دخول</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>الرجاء إدخال بيانات الدخول الخاصة بك</p>
        </div>
        {success ? (
          <div className="text-center py-4 animate-scale-in">
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Check size={28} style={{ color: 'var(--success)' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>تم تسجيل الدخول بنجاح</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>جاري الانتقال إلى لوحة التحكم...</p>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#aaa', fontWeight: 600 }}>اسم المستخدم أو البريد</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="admin@business.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ backgroundColor: '#1b1b26', borderColor: '#2e2e3f', color: '#fff', paddingInlineStart: '2.5rem' }}
                  required
                />
                <div style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <User size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: '#aaa', fontWeight: 600 }}>كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ backgroundColor: '#1b1b26', borderColor: '#2e2e3f', color: '#fff', paddingInlineStart: '2.5rem' }}
                  required
                />
                <div style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-100%)', pointerEvents: 'none' }}>
                  <Key size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
            {error && (
              <div className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', margin: '1rem 0', borderRadius: '8px', fontSize: '0.85rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}
            <button type="submit" className="btn btn-primary w-100 mt-2" style={{ padding: '0.85rem', fontWeight: 'bold' }}>
              دخول للوحة التحكم
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
