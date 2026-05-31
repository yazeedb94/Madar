'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/lib/context';
import { Save, Download, Upload, RefreshCw, Building2, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

type Tab = 'business' | 'account';

export default function Settings() {
  const { settings, updateSettings, t, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('business');

  /* ─── Business Tab State ─── */
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [bizLoading, setBizLoading] = useState(false);
  const [bizSuccess, setBizSuccess] = useState(false);

  /* ─── Account Tab State ─── */
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accLoading, setAccLoading] = useState(false);
  const [accError, setAccError] = useState('');
  const [accSuccess, setAccSuccess] = useState('');

  /* ─── Init ─── */
  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || '');
      setCurrency(settings.currency || 'SAR');
      setLanguage(settings.language || 'ar');
      setTheme(settings.theme || 'dark');
    }
    const fetchTenant = async () => {
      if (typeof window !== 'undefined') {
        const activeId = localStorage.getItem('saas_active_tenant_id');
        if (activeId) {
          try {
            const res = await fetch(`/api/tenants/${activeId}`);
            if (res.ok) {
              const tenant = await res.json();
              setEmail(tenant?.email || '');
            }
          } catch (_) {}
        }
      }
    };
    fetchTenant();
  }, [settings]);

  /* ─── Business Submit ─── */
  const handleBizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBizLoading(true);
    setBizSuccess(false);
    updateSettings({ businessName, businessType: settings.businessType, currency, language, theme, isOnboarded: true });
    const activeId = typeof window !== 'undefined' ? localStorage.getItem('saas_active_tenant_id') : null;
    if (activeId) {
      try {
        await fetch('/api/tenants', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: activeId, name: businessName, currency, language }),
        });
      } catch (_) {}
    }
    setTimeout(() => { setBizLoading(false); setBizSuccess(true); setTimeout(() => setBizSuccess(false), 3000); }, 400);
    refreshData();
  };

  /* ─── Account Submit ─── */
  const handleAccSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccError('');
    setAccSuccess('');

    if (!email) { setAccError(t('البريد الإلكتروني مطلوب.', 'Email is required.')); return; }

    const isChangingPassword = newPassword.length > 0 || currentPassword.length > 0;

    if (isChangingPassword) {
      if (!currentPassword) { setAccError(t('يرجى إدخال كلمة المرور الحالية.', 'Please enter your current password.')); return; }
      if (!newPassword) { setAccError(t('يرجى إدخال كلمة المرور الجديدة.', 'Please enter a new password.')); return; }
      if (newPassword.length < 6) { setAccError(t('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.', 'New password must be at least 6 characters.')); return; }
      if (newPassword !== confirmPassword) { setAccError(t('كلمة المرور الجديدة وتأكيدها غير متطابقتين.', 'New password and confirmation do not match.')); return; }
    }

    setAccLoading(true);
    const activeId = typeof window !== 'undefined' ? localStorage.getItem('saas_active_tenant_id') : null;
    if (!activeId) { setAccError('Session error.'); setAccLoading(false); return; }

    try {
      // 1. Verify current password against server before allowing change
      if (isChangingPassword) {
        const verifyRes = await fetch('/api/auth/verify-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: activeId, password: currentPassword }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.valid) {
          setAccError(t('كلمة المرور الحالية غير صحيحة.', 'Current password is incorrect.'));
          setAccLoading(false);
          return;
        }
      }


      // 2. Push updates to database
      const updates: any = { email };
      if (isChangingPassword) updates.password = newPassword;

      const res = await fetch('/api/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeId, ...updates }),
      });
      if (!res.ok) {
        const err = await res.json();
        setAccError(err.error || t('حدث خطأ أثناء الحفظ.', 'An error occurred while saving.'));
        setAccLoading(false);
        return;
      }

      setAccSuccess(t('تم تحديث بيانات الحساب بنجاح ✓', 'Account updated successfully ✓'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setAccError(t('خطأ في الاتصال بالخادم.', 'Server connection error.'));
    }
    setAccLoading(false);
  };

  /* ─── Backup / Restore ─── */
  const handleBackup = () => {
    const keys = ['saas_sub_settings','saas_sub_customers','saas_sub_plans','saas_sub_attendance','saas_sub_payments','saas_sub_notifications'];
    const db: Record<string, any> = {};
    keys.forEach(k => { const v = localStorage.getItem(k); db[k] = v ? JSON.parse(v) : null; });
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `backup_${settings.businessName.replace(/\s+/g,'_')}_db.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!confirm(t('تحذير: سيقوم هذا باستبدال كامل البيانات الحالية. هل ترغب بالاستمرار؟','Warning: This will overwrite all current data. Continue?'))) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const db = JSON.parse(evt.target?.result as string);
        Object.entries(db).forEach(([k, v]) => { if (v) localStorage.setItem(k, JSON.stringify(v)); });
        alert(t('تم الاستعادة بنجاح!','Restored successfully!'));
        window.location.href = '/dashboard';
      } catch { alert(t('ملف غير صالح.','Invalid backup file.')); }
    };
    reader.readAsText(file);
  };

  /* ─── Shared tab button style ─── */
  const tabStyle = (tab: Tab): React.CSSProperties => ({
    padding: '0.65rem 1.5rem',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
    background: activeTab === tab ? 'var(--primary)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
    boxShadow: activeTab === tab ? '0 2px 10px var(--primary-shadow, rgba(99,102,241,.35))' : 'none',
  });

  return (
    <AppShell>
      <div className="page-container animate-fade-in" style={{ maxWidth: '900px' }}>

        {/* Header */}
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }} className="mb-05">
          {t('الإعدادات والخيارات العامة', 'General System Settings')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mb-3">
          {t('تخصيص هوية النشاط التجاري، وإدارة بيانات الحساب وكلمة المرور بأمان.', 'Customize your business profile and manage account credentials securely.')}
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: 'fit-content', marginBottom: '2rem' }}>
          <button style={tabStyle('business')} onClick={() => setActiveTab('business')}>
            <Building2 size={16} />
            {t('إعدادات النشاط', 'Business Settings')}
          </button>
          <button style={tabStyle('account')} onClick={() => setActiveTab('account')}>
            <Lock size={16} />
            {t('الحساب والأمان', 'Account & Security')}
          </button>
        </div>

        {/* ──────────── TAB 1: BUSINESS ──────────── */}
        {activeTab === 'business' && (
          <div className="grid grid-2" style={{ gap: '2rem', gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>

            <form className="card animate-fade-in" onSubmit={handleBizSubmit}>
              <h3 className="card-title mb-2">{t('الملف التجاري للنظام', 'Business Identity')}</h3>

              <div className="form-group">
                <label className="form-label">{t('اسم النشاط التجاري *', 'Business Name *')}</label>
                <input type="text" className="form-input" required value={businessName} onChange={e => setBusinessName(e.target.value)} />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">{t('العملة المالية المعتمدة', 'System Currency')}</label>
                  <select className="form-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                    <option value="SAR">SAR (ريال سعودي)</option>
                    <option value="JOD">JOD (دينار أردني)</option>
                    <option value="AED">AED (درهم إماراتي)</option>
                    <option value="KWD">KWD (دينار كويتي)</option>
                    <option value="QAR">QAR (ريال قطري)</option>
                    <option value="BHD">BHD (دينار بحريني)</option>
                    <option value="OMR">OMR (ريال عُماني)</option>
                    <option value="EGP">EGP (جنيه مصري)</option>
                    <option value="USD">USD (دولار أمريكي)</option>
                    <option value="EUR">EUR (يورو)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('لغة الواجهة', 'System Language')}</label>
                  <select className="form-select" value={language} onChange={e => setLanguage(e.target.value as any)}>
                    <option value="ar">العربية (RTL)</option>
                    <option value="en">English (LTR)</option>
                  </select>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">{t('المظهر العام للنظام', 'Theme Mode')}</label>
                <select className="form-select" value={theme} onChange={e => setTheme(e.target.value as any)}>
                  <option value="dark">الوضع الداكن الفاخر (Premium Dark)</option>
                  <option value="light">الوضع الفاتح الأنيق (Clean Light)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={bizLoading}>
                {bizLoading ? (
                  <span style={{ opacity: 0.7 }}>{t('جارٍ الحفظ...', 'Saving...')}</span>
                ) : bizSuccess ? (
                  <><Check size={16} /> {t('تم الحفظ بنجاح!', 'Saved successfully!')}</>
                ) : (
                  <><Save size={16} /> {t('حفظ إعدادات النشاط', 'Save Business Settings')}</>
                )}
              </button>
            </form>

            {/* Backup card */}
            <div className="flex-column gap-2">
              <div className="card">
                <h3 className="card-title mb-2">{t('النسخ الاحتياطي', 'Data Backup')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }} className="mb-2">
                  {t('تنزيل وحفظ جميع بيانات نشاطك في ملف JSON آمن.', 'Download all your business data to a safe JSON file.')}
                </p>
                <div className="flex-column gap-1">
                  <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleBackup}>
                    <Download size={16} /> {t('تصدير نسخة احتياطية', 'Export Backup')}
                  </button>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input type="file" id="restoreFile" style={{ display: 'none' }} accept=".json" onChange={handleRestore} />
                    <button className="btn btn-secondary" style={{ width: '100%', color: 'var(--warning)' }} onClick={() => document.getElementById('restoreFile')?.click()}>
                      <Upload size={16} /> {t('استعادة البيانات', 'Restore Backup')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card text-center" style={{ backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
                <RefreshCw size={24} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  {t('قاعدة بيانات المتصفح النشطة', 'Local Sandbox Database Active')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ──────────── TAB 2: ACCOUNT & SECURITY ──────────── */}
        {activeTab === 'account' && (
          <div style={{ maxWidth: '520px' }}>
            <form className="card animate-fade-in" onSubmit={handleAccSubmit}>
              <h3 className="card-title mb-05">{t('بيانات الدخول والأمان', 'Login Credentials & Security')}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }} className="mb-3">
                {t('تحديث البريد الإلكتروني وكلمة المرور. يجب إدخال كلمة المرور الحالية لتأكيد التغيير.', 'Update your email and password. Current password is required to confirm any changes.')}
              </p>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">{t('البريد الإلكتروني (للدخول)', 'Email Address (for login)')}</label>
                <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '1.5rem 0', opacity: 0.4 }} />
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {t('🔑 تغيير كلمة المرور (اختياري)', '🔑 Change Password (optional)')}
              </p>

              {/* Current Password */}
              <div className="form-group">
                <label className="form-label">{t('كلمة المرور الحالية', 'Current Password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    className="form-input"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder={t('أدخل كلمة مرورك الحالية', 'Enter current password')}
                    style={{ paddingInlineEnd: '2.5rem' }}
                  />
                  <button type="button" onClick={() => setShowCurrent(p => !p)}
                    style={{ position: 'absolute', insetInlineEnd: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label">{t('كلمة المرور الجديدة', 'New Password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="form-input"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder={t('6 أحرف على الأقل', 'At least 6 characters')}
                    style={{ paddingInlineEnd: '2.5rem' }}
                  />
                  <button type="button" onClick={() => setShowNew(p => !p)}
                    style={{ position: 'absolute', insetInlineEnd: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength indicator */}
                {newPassword.length > 0 && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '4px' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '4px', borderRadius: '4px',
                        background: newPassword.length >= i * 2
                          ? i <= 1 ? 'var(--danger)' : i === 2 ? 'var(--warning)' : i === 3 ? '#3b82f6' : 'var(--success)'
                          : 'var(--border-color)',
                        transition: 'background 0.3s'
                      }} />
                    ))}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {newPassword.length < 4 ? t('ضعيفة','Weak') : newPassword.length < 6 ? t('متوسطة','Fair') : newPassword.length < 8 ? t('جيدة','Good') : t('قوية','Strong')}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group mb-3">
                <label className="form-label">{t('تأكيد كلمة المرور الجديدة', 'Confirm New Password')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="form-input"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder={t('أعد كتابة كلمة المرور الجديدة', 'Re-enter new password')}
                    style={{
                      paddingInlineEnd: '2.5rem',
                      borderColor: confirmPassword && newPassword !== confirmPassword ? 'var(--danger)' : confirmPassword && newPassword === confirmPassword ? 'var(--success)' : undefined,
                    }}
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    style={{ position: 'absolute', insetInlineEnd: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    {t('كلمتا المرور غير متطابقتين', 'Passwords do not match')}
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
                  <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    <Check size={12} style={{ display: 'inline', marginInlineEnd: '0.25rem' }} />
                    {t('كلمتا المرور متطابقتان', 'Passwords match')}
                  </p>
                )}
              </div>

              {/* Feedback messages */}
              {accError && (
                <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
                  <AlertCircle size={16} /> {accError}
                </div>
              )}
              {accSuccess && (
                <div style={{ background: 'rgba(34,197,94,.12)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.875rem' }}>
                  <Check size={16} /> {accSuccess}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={accLoading}>
                {accLoading ? t('جارٍ التحقق والحفظ...', 'Verifying & saving...') : <><Lock size={16} /> {t('حفظ بيانات الحساب', 'Save Account Settings')}</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
