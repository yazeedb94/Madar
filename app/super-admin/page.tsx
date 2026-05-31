'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle, 
  Lock, 
  Globe, 
  RefreshCw, 
  Plus, 
  Trash2, 
  DollarSign, 
  Edit2, 
  X,
  Activity,
  Server,
  FileText,
  CheckCircle,
  Bell,
  HelpCircle,
  Key,
  Cpu,
  HardDrive,
  Database,
  Shield,
  Radio,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserX,
  LockOpen,
  MailCheck,
  LogOut,
  Send,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import { 
  seedDatabase,
  backupTenantData,
  restoreTenantData,
  switchTenantContext
} from '@/lib/store';
import { BUSINESS_TYPES } from '@/lib/businessTypes';

export default function SuperAdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'businesses' | 'billing' | 'users' | 'support' | 'health' | 'logs' | 'security' | 'notifications' | 'settings'
  >('dashboard');

  // Stats & States loaded from APIs
  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [platformPlans, setPlatformPlans] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [ticketLogs, setTicketLogs] = useState<any[]>([]);
  const [securityData, setSecurityData] = useState<any>(null);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  
  // Loading flags
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Modals & form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTenantId, setEditTenantId] = useState<string | null>(null);
  
  // New Business Form State
  const [newBizName, setNewBizName] = useState('');
  const [newBizType, setNewBizType] = useState<string>('gym');
  const [newBizCurrency, setNewBizCurrency] = useState('SAR');
  const [newBizPlan, setNewBizPlan] = useState<string>('Premium');
  const [newBizLanguage, setNewBizLanguage] = useState<'ar' | 'en'>('ar');
  const [newBizEmail, setNewBizEmail] = useState('');
  const [newBizPassword, setNewBizPassword] = useState('');

  // Customize Subscription Modal State
  const [showCustModal, setShowCustModal] = useState(false);
  const [custTenantId, setCustTenantId] = useState<string | null>(null);
  const [custTenantName, setCustTenantName] = useState('');
  const [custPlan, setCustPlan] = useState('');
  const [custPeriod, setCustPeriod] = useState('monthly');
  const [customCustPeriodDays, setCustomCustPeriodDays] = useState<number>(7);
  const [customCustPeriodMonths, setCustomCustPeriodMonths] = useState<number>(3);
  const [custPrice, setCustPrice] = useState<string>('');
  const [custExpiry, setCustExpiry] = useState<string>('');

  // Platform Plan Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isPlanEditMode, setIsPlanEditMode] = useState(false);
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState<number>(199);
  const [planPeriod, setPlanPeriod] = useState('monthly');
  const [customPlanPeriodDays, setCustomPlanPeriodDays] = useState<number>(7);
  const [customPlanPeriodMonths, setCustomPlanPeriodMonths] = useState<number>(3);
  const [planCurrency, setPlanCurrency] = useState('SAR');
  const [planFeatures, setPlanFeatures] = useState('');

  // Technical support states
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  
  // Troubleshooting support log state
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLogType, setNewLogType] = useState<'problem' | 'solution'>('problem');
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogContent, setNewLogContent] = useState('');

  // Security restrictions
  const [ipRestrictionsEnabled, setIpRestrictionsEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [suspiciousLoginEnabled, setSuspiciousLoginEnabled] = useState(true);

  // Broadcast Hub state
  const [broadcastType, setBroadcastType] = useState<'maintenance' | 'update'>('update');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastStatusMessage, setBroadcastStatusMessage] = useState('');

  // SaaS Settings states
  const [saasPlatformName, setSaasPlatformName] = useState('');
  const [saasTaxes, setSaasTaxes] = useState(15);
  const [saasCurrency, setSaasCurrency] = useState('SAR');
  const [saasLanguage, setSaasLanguage] = useState('ar');
  const [saasAdminEmail, setSaasAdminEmail] = useState('admin@saas.com');
  const [saasAdminPassword, setSaasAdminPassword] = useState('');
  const [saasSettingsTab, setSaasSettingsTab] = useState<'config' | 'security'>('config');
  const [saasCurrentPassword, setSaasCurrentPassword] = useState('');
  const [saasNewPassword, setSaasNewPassword] = useState('');
  const [saasConfirmPassword, setSaasConfirmPassword] = useState('');
  const [saasPasswordError, setSaasPasswordError] = useState('');
  const [saasPasswordSuccess, setSaasPasswordSuccess] = useState('');

  // Simulated metrics that fluctuate in real-time
  const [simulatedCpu, setSimulatedCpu] = useState(12);
  const [simulatedRam, setSimulatedRam] = useState(62);
  const [simulatedDbLoad, setSimulatedDbLoad] = useState(7);
  const [simulatedLiveLogs, setSimulatedLiveLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial system configurations
  useEffect(() => {
    setMounted(true);
    const authStatus = sessionStorage.getItem('is_super_admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadAllData();
    }
  }, []);

  // Fluctuating metric timer + console logs simulation
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const metricInterval = setInterval(() => {
      setSimulatedCpu(prev => {
        const offset = Math.floor(Math.random() * 9) - 4;
        const next = prev + offset;
        return Math.max(3, Math.min(85, next));
      });
      setSimulatedRam(prev => {
        const offset = Math.floor(Math.random() * 3) - 1;
        const next = prev + offset;
        return Math.max(58, Math.min(74, next));
      });
      setSimulatedDbLoad(prev => {
        const offset = Math.floor(Math.random() * 5) - 2;
        const next = prev + offset;
        return Math.max(2, Math.min(45, next));
      });

      // Stream fake log records
      const logs = [
        `[JOB] SyncTenantBackup scheduled running... Success`,
        `[DB] Connection pool clean: 0 idle connections closed`,
        `[METRIC] Garbage collection finished in 24ms`,
        `[SYNC] LocalStorage synced backups count: ${tenants.length} tenants active`,
        `[ROUTING] imp_owner switched context verified successfully`,
        `[API] GET /api/saas/stats 200 OK - 15ms`,
        `[SECURITY] IP checking pass: 127.0.0.1 trusted origin`,
        `[MAILER] Broadcast queue: Idle`
      ];
      const randomLog = logs[Math.floor(Math.random() * logs.length)];
      const timestamp = new Date().toLocaleTimeString();
      setSimulatedLiveLogs(prev => [...prev.slice(-20), `[${timestamp}] ${randomLog}`]);
    }, 2500);

    return () => clearInterval(metricInterval);
  }, [isAuthenticated, tenants]);

  // Scroll live logs console to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simulatedLiveLogs]);

  // Load all platform data from backend APIs
  const loadAllData = async () => {
    setLoadingStats(true);
    setLoadingTenants(true);
    setLoadingUsers(true);
    setLoadingTickets(true);

    try {
      // 1. Stats
      const resStats = await fetch('/api/saas/stats');
      if (resStats.ok) {
        const statsData = await resStats.json();
        setStats(statsData);
        setTwoFactorEnabled(statsData.settings.twoFactorEnabled !== false);
        setSuspiciousLoginEnabled(statsData.settings.suspiciousLoginDetection !== false);
      }

      // 2. Tenants
      const resTenants = await fetch('/api/saas/tenants');
      if (resTenants.ok) {
        const tenantsData = await resTenants.json();
        setTenants(tenantsData);
      }

      // 3. Platform plans
      const resPlans = await fetch('/api/platform-plans');
      if (resPlans.ok) {
        const plansData = await resPlans.json();
        setPlatformPlans(plansData);
      }

      // 4. Users/Owners
      const resUsers = await fetch('/api/saas/users');
      if (resUsers.ok) {
        const usersData = await resUsers.json();
        setUsersList(usersData);
      }

      // 5. Support tickets
      const resTickets = await fetch('/api/saas/tickets');
      if (resTickets.ok) {
        const ticketsData = await resTickets.json();
        setTicketsList(ticketsData);
      }

      // 6. Troubleshooting Logs
      const resLogs = await fetch('/api/saas/tickets/logs');
      if (resLogs.ok) {
        const logsData = await resLogs.json();
        setTicketLogs(logsData);
      }

      // 7. Security data
      const resSec = await fetch('/api/saas/security');
      if (resSec.ok) {
        const secData = await resSec.json();
        setSecurityData(secData);
        setIpRestrictionsEnabled(secData.settings.ipRestrictions);
      }

      // 8. Platform settings
      const resSettings = await fetch('/api/saas/settings');
      if (resSettings.ok) {
        const settingsData = await resSettings.json();
        setPlatformSettings(settingsData);
        setSaasPlatformName(settingsData.platformName);
        setSaasTaxes(settingsData.taxes);
        setSaasCurrency(settingsData.currency);
        setSaasLanguage(settingsData.language);
        setSaasAdminEmail(settingsData.adminEmail);
      }

    } catch (err) {
      console.error('Error loading data', err);
    } finally {
      setLoadingStats(false);
      setLoadingTenants(false);
      setLoadingUsers(false);
      setLoadingTickets(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/saas/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem('is_super_admin_authenticated', 'true');
        // Set super admin cookie to allow bypassing session checks during impersonation
        document.cookie = 'is_super_admin=true; path=/; max-age=86400';
        setIsAuthenticated(true);
        loadAllData();
      } else {
        setLoginError(data.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة!');
      }
    } catch (err) {
      console.error(err);
      setLoginError('حدث خطأ أثناء الاتصال بالخادم.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('is_super_admin_authenticated');
    document.cookie = 'is_super_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setIsAuthenticated(false);
  };

  // Impersonate Tenant Owner
  const handleImpersonate = (tenant: any) => {
    sessionStorage.setItem('is_super_admin_impersonating', 'true');
    sessionStorage.setItem('super_admin_impersonating_tenant_name', tenant.name);

    if (typeof window !== 'undefined') {
      const currentActiveId = localStorage.getItem('saas_active_tenant_id');
      if (currentActiveId) {
        backupTenantData(currentActiveId);
      }
      localStorage.setItem('saas_active_tenant_id', tenant.id);
      restoreTenantData(tenant.id);
    }

    switchTenantContext(tenant.id);
    window.location.href = '/dashboard';
  };

  // Delete Business
  const handleDeleteTenant = async (tenantId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا النشاط التجاري بالكامل؟ سيتم مسح جميع البيانات المرتبطة والنسخ الاحتياطية نهائياً.')) {
      try {
        const res = await fetch('/api/saas/tenants', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: tenantId })
        });
        if (res.ok) {
          setTenants(prev => prev.filter(t => t.id !== tenantId));
          // Clean active pointer if needed
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`saas_tenant_backup_${tenantId}`);
            const activeId = localStorage.getItem('saas_active_tenant_id');
            if (activeId === tenantId) {
              localStorage.removeItem('saas_active_tenant_id');
            }
          }
          loadAllData();
        } else {
          alert('فشل عملية الحذف من الخادم');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Create or Update Tenant
  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim() || !newBizEmail.trim()) {
      alert('الرجاء تعبئة كافة الحقول المطلوبة');
      return;
    }

    const payload = {
      name: newBizName,
      type: newBizType,
      currency: newBizCurrency,
      plan: newBizPlan,
      language: newBizLanguage,
      email: newBizEmail.trim().toLowerCase(),
      password: newBizPassword
    };

    try {
      let res;
      if (isEditMode && editTenantId) {
        res = await fetch('/api/saas/tenants', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editTenantId, ...payload })
        });
      } else {
        res = await fetch('/api/saas/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const tenantResult = await res.json();
        
        // Seed mock database for new tenants in local backups
        if (!isEditMode && typeof window !== 'undefined') {
          const currentActiveId = localStorage.getItem('saas_active_tenant_id') || 'tenant_1';
          backupTenantData(currentActiveId);
          seedDatabase(newBizType, newBizName, newBizCurrency);
          backupTenantData(tenantResult.id);
          restoreTenantData(currentActiveId);
        }

        setShowAddModal(false);
        loadAllData();
      } else {
        const err = await res.json();
        alert(`فشل الحفظ: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle tenant status
  const handleToggleTenantStatus = async (tenantId: string, currentStatus: string, nextStatus: string) => {
    try {
      const res = await fetch('/api/saas/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenantId, status: nextStatus })
      });
      if (res.ok) {
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Customize Tenant subscription properties
  const handleSaveCustSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custTenantId) return;

    try {
      const res = await fetch('/api/saas/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: custTenantId,
          plan: custPlan,
          subscriptionPeriod: custPeriod,
          subscriptionPrice: custPrice.trim() !== '' ? parseFloat(custPrice) : null,
          expiryDate: custExpiry.trim() !== '' ? custExpiry : null
        })
      });
      if (res.ok) {
        setShowCustModal(false);
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Platform Plan CRUD
  const handleSavePlatformPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    const payload = {
      name: planName,
      price: planPrice,
      period: planPeriod,
      currency: planCurrency,
      features: planFeatures
    };

    try {
      let res;
      if (isPlanEditMode && editPlanId) {
        res = await fetch('/api/platform-plans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editPlanId, ...payload })
        });
      } else {
        res = await fetch('/api/platform-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowPlanModal(false);
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlatformPlan = async (planId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الباقة المنصاتية؟ قد يؤثر هذا الإجراء على فوترة الأنشطة.')) {
      try {
        const res = await fetch(`/api/platform-plans/${planId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          loadAllData();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // General user actions (Suspend, Reset password, force logout, Ban, Verify email)
  const handleUserAction = async (userId: string, action: string, extraParam?: string) => {
    try {
      const res = await fetch('/api/saas/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action,
          newPassword: extraParam
        })
      });
      if (res.ok) {
        alert('تم تنفيذ الإجراء بنجاح وتوثيقه في سجل الأنشطة.');
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Support Ticket response
  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      const res = await fetch('/api/saas/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTicket.id,
          reply: ticketReplyText,
          status: 'resolved'
        })
      });
      if (res.ok) {
        setShowTicketModal(false);
        setTicketReplyText('');
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Troubleshooting Support Log
  const handleSaveSupportLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogTitle.trim() || !newLogContent.trim()) return;

    try {
      const res = await fetch('/api/saas/tickets/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newLogType,
          title: newLogTitle,
          content: newLogContent
        })
      });
      if (res.ok) {
        setShowLogModal(false);
        setNewLogTitle('');
        setNewLogContent('');
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Security Options
  const handleToggleSecurityOption = async (option: string, value: boolean) => {
    try {
      const res = await fetch('/api/saas/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: option,
          enabled: value
        })
      });
      if (res.ok) {
        if (option === 'twoFactor') setTwoFactorEnabled(value);
        if (option === 'suspicious') setSuspiciousLoginEnabled(value);
        if (option === 'ipRestrict') setIpRestrictionsEnabled(value);
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Terminate security session
  const handleTerminateSession = async (sessionId: string) => {
    if (confirm('هل أنت متأكد من إنهاء جلسة العمل هذه فوراً؟ سيتم تسجيل خروج المستخدم تلقائياً.')) {
      try {
        const res = await fetch('/api/saas/security', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: sessionId })
        });
        if (res.ok) {
          loadAllData();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Broadcast Notification send
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      alert('الرجاء إدخال عنوان ونص الإشعار');
      return;
    }

    setBroadcastStatusMessage('جاري تشغيل المعالجة المتوازية للإرسال وتحديث النسخ الاحتياطية...');
    try {
      const res = await fetch('/api/saas/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          type: broadcastType
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBroadcastStatusMessage(`تم الإرسال بنجاح! تم التوجيه إلى ${data.count} نشاط تجاري نشط بنجاح.`);
        setBroadcastTitle('');
        setBroadcastMessage('');
        setTimeout(() => setBroadcastStatusMessage(''), 5000);
        loadAllData();
      } else {
        setBroadcastStatusMessage('فشل إرسال الإشعار الجماعي.');
      }
    } catch (err) {
      console.error(err);
      setBroadcastStatusMessage('حدث خطأ أثناء الاتصال بالخادم.');
    }
  };

  // Save platform configuration settings
  const handleSaveSaaSConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaasPasswordError('');
    setSaasPasswordSuccess('');

    // If changing password, validate new password matches confirm password
    if (saasSettingsTab === 'security' && saasNewPassword) {
      if (saasNewPassword !== saasConfirmPassword) {
        setSaasPasswordError('كلمة المرور الجديدة وتأكيدها غير متطابقين!');
        return;
      }
    }

    try {
      const body: any = {
        platformName: saasPlatformName,
        taxes: saasTaxes,
        currency: saasCurrency,
        language: saasLanguage,
        adminEmail: saasAdminEmail,
      };

      if (saasSettingsTab === 'security' && saasNewPassword) {
        body.currentPassword = saasCurrentPassword;
        body.newPassword = saasNewPassword;
      }

      const res = await fetch('/api/saas/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        alert('تم حفظ إعدادات المنصة وتحديث البيانات بنجاح!');
        setSaasCurrentPassword('');
        setSaasNewPassword('');
        setSaasConfirmPassword('');
        setSaasPasswordSuccess('تم تحديث البيانات وكلمة المرور بنجاح!');
        loadAllData();
      } else {
        setSaasPasswordError(data.error || 'فشل تحديث البيانات، يرجى التحقق من المدخلات.');
        alert(data.error || 'فشل تحديث البيانات.');
      }
    } catch (err) {
      console.error(err);
      setSaasPasswordError('حدث خطأ غير متوقع أثناء الاتصال بالخادم.');
    }
  };

  // Defer rendering until client-side hydration complete
  if (!mounted) {
    return <div className="setup-container" />;
  }

  // --- LOGIN PANEL VIEW (if unauthenticated) ---
  if (!isAuthenticated) {
    return (
      <div className="setup-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090e' }}>
        <div className="setup-card animate-fade-in" style={{ maxWidth: '460px', width: '100%', border: '1px solid rgba(99, 102, 241, 0.25)', boxShadow: '0 12px 40px rgba(99, 102, 241, 0.1)', background: '#11111b', borderRadius: '16px' }}>
          <div className="text-center mb-3">
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }}>
              <Lock size={30} style={{ color: '#6366f1' }} />
            </div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>بوابة مسؤول المنصة العام</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>SaaS Multi-Tenant Super Admin Control Hub</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#c7d2fe' }}>البريد الإلكتروني للتحكم</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="admin@saas.com" 
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                style={{ backgroundColor: '#171725', borderColor: '#2e2e48', color: '#fff' }}
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" style={{ color: '#c7d2fe' }}>كلمة المرور المشفرة</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                style={{ backgroundColor: '#171725', borderColor: '#2e2e48', color: '#fff' }}
                required
              />
            </div>

            {loginError && (
              <div className="badge badge-danger" style={{ display: 'block', padding: '0.85rem', margin: '1.25rem 0', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                {loginError}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100" style={{ padding: '0.9rem', fontSize: '1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} /> دخول إلى مركز السيطرة الآمن
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- PREMIUM SUPER ADMIN DASHBOARD HUB VIEW ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090e', color: '#f3f4f6', direction: 'rtl', fontFamily: 'Cairo, sans-serif', display: 'flex' }}>
      
      {/* 1. Sleek Right/Left Sidebar Navigation (Glassmorphic Glow & harmony) */}
      <aside style={{ 
        width: '295px', 
        background: 'linear-gradient(180deg, rgba(16, 16, 27, 0.8) 0%, rgba(9, 9, 14, 0.95) 100%)', 
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.06)', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100,
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.25)'
      }}>
        
        {/* Sidebar Brand Logo */}
        <div style={{ 
          padding: '1.75rem 1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.85rem', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%)' 
        }}>
          <div style={{ 
            backgroundColor: 'rgba(99, 102, 241, 0.18)', 
            padding: '0.65rem', 
            borderRadius: '12px', 
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={24} style={{ color: '#818cf8' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.3px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              {platformSettings?.platformName || saasPlatformName || 'لوحة السوبر أدمن'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
              <span style={{ 
                display: 'inline-block', 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#10b981', 
                boxShadow: '0 0 10px #10b981, 0 0 2px #10b981' 
              }}></span>
              <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>متصل بالكامل ({stats?.system.uptime || '99.98%'})</span>
            </div>
          </div>
        </div>

        {/* Sidebar Links Menu Container */}
        <nav style={{ 
          flex: 1, 
          padding: '1.5rem 0.75rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.4rem', 
          overflowY: 'auto' 
        }}>
          
          <button 
            onClick={() => setActiveTab('dashboard')} 
            style={{ 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              textAlign: 'right', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '0.75rem', 
              width: '100%', 
              color: activeTab === 'dashboard' ? '#fff' : '#9ca3af', 
              backgroundColor: activeTab === 'dashboard' ? 'rgba(99, 102, 241, 0.14)' : 'transparent', 
              borderRight: activeTab === 'dashboard' ? '3.5px solid #6366f1' : '3.5px solid transparent',
              padding: '0.8rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.92rem', 
              fontWeight: activeTab === 'dashboard' ? 700 : 500,
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Activity size={18} style={{ color: activeTab === 'dashboard' ? '#818cf8' : '#6b7280' }} />
              <span>نظرة عامة والذكاء المالي</span>
            </div>
            <span style={{ 
              fontSize: '0.7rem', 
              color: '#34d399', 
              backgroundColor: 'rgba(16, 185, 129, 0.1)', 
              padding: '0.15rem 0.45rem', 
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              fontWeight: 'bold'
            }}>نشط الآن</span>
          </button>

          <button 
            onClick={() => setActiveTab('businesses')} 
            style={{ 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              textAlign: 'right', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '0.75rem', 
              width: '100%', 
              color: activeTab === 'businesses' ? '#fff' : '#9ca3af', 
              backgroundColor: activeTab === 'businesses' ? 'rgba(99, 102, 241, 0.14)' : 'transparent', 
              borderRight: activeTab === 'businesses' ? '3.5px solid #6366f1' : '3.5px solid transparent',
              padding: '0.8rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.92rem', 
              fontWeight: activeTab === 'businesses' ? 700 : 500,
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Building2 size={18} style={{ color: activeTab === 'businesses' ? '#818cf8' : '#6b7280' }} />
              <span>إدارة الأنشطة (Tenants)</span>
            </div>
            <span style={{ 
              fontSize: '0.75rem', 
              color: '#a5b4fc', 
              backgroundColor: 'rgba(99, 102, 241, 0.15)', 
              padding: '0.1rem 0.5rem', 
              borderRadius: '20px',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontWeight: 'bold'
            }}>{tenants.length}</span>
          </button>

          <button 
            onClick={() => setActiveTab('billing')} 
            style={{ 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              textAlign: 'right', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '0.75rem', 
              width: '100%', 
              color: activeTab === 'billing' ? '#fff' : '#9ca3af', 
              backgroundColor: activeTab === 'billing' ? 'rgba(99, 102, 241, 0.14)' : 'transparent', 
              borderRight: activeTab === 'billing' ? '3.5px solid #6366f1' : '3.5px solid transparent',
              padding: '0.8rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.92rem', 
              fontWeight: activeTab === 'billing' ? 700 : 500,
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <DollarSign size={18} style={{ color: activeTab === 'billing' ? '#818cf8' : '#6b7280' }} />
              <span>الاشتراكات والفوترة والخطط</span>
            </div>
            <span style={{ 
              fontSize: '0.75rem', 
              color: '#fcd34d', 
              backgroundColor: 'rgba(245, 158, 11, 0.15)', 
              padding: '0.1rem 0.5rem', 
              borderRadius: '20px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              fontWeight: 'bold'
            }}>{platformPlans.length} خطط</span>
          </button>

          <button 
            onClick={() => setActiveTab('users')} 
            style={{ 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              textAlign: 'right', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '0.75rem', 
              width: '100%', 
              color: activeTab === 'users' ? '#fff' : '#9ca3af', 
              backgroundColor: activeTab === 'users' ? 'rgba(99, 102, 241, 0.14)' : 'transparent', 
              borderRight: activeTab === 'users' ? '3.5px solid #6366f1' : '3.5px solid transparent',
              padding: '0.8rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.92rem', 
              fontWeight: activeTab === 'users' ? 700 : 500,
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={18} style={{ color: activeTab === 'users' ? '#818cf8' : '#6b7280' }} />
              <span>دليل المستخدمين والأصحاب</span>
            </div>
            <span style={{ 
              fontSize: '0.75rem', 
              color: '#2dd4bf', 
              backgroundColor: 'rgba(45, 212, 191, 0.15)', 
              padding: '0.1rem 0.5rem', 
              borderRadius: '20px',
              border: '1px solid rgba(45, 212, 191, 0.2)',
              fontWeight: 'bold'
            }}>{usersList.length}</span>
          </button>

          <button 
            onClick={() => setActiveTab('support')} 
            style={{ 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              textAlign: 'right', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '0.75rem', 
              width: '100%', 
              color: activeTab === 'support' ? '#fff' : '#9ca3af', 
              backgroundColor: activeTab === 'support' ? 'rgba(99, 102, 241, 0.14)' : 'transparent', 
              borderRight: activeTab === 'support' ? '3.5px solid #6366f1' : '3.5px solid transparent',
              padding: '0.8rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.92rem', 
              fontWeight: activeTab === 'support' ? 700 : 500,
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <HelpCircle size={18} style={{ color: activeTab === 'support' ? '#818cf8' : '#6b7280' }} />
              <span>نظام الدعم الفني والتذاكر</span>
            </div>
            {ticketsList.filter(t => t.status === 'open').length > 0 ? (
              <span style={{ 
                fontSize: '0.75rem', 
                color: '#ef4444', 
                backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                padding: '0.1rem 0.5rem', 
                borderRadius: '20px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: 'bold',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.2)'
              }} className="pulse">{ticketsList.filter(t => t.status === 'open').length} معلقة</span>
            ) : (
              <span style={{ 
                fontSize: '0.75rem', 
                color: '#34d399', 
                backgroundColor: 'rgba(16, 185, 129, 0.12)', 
                padding: '0.1rem 0.5rem', 
                borderRadius: '20px',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontWeight: 'bold'
              }}>0 مفتوح</span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('health')} 
            style={{ 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              textAlign: 'right', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '0.75rem', 
              width: '100%', 
              color: activeTab === 'health' ? '#fff' : '#9ca3af', 
              backgroundColor: activeTab === 'health' ? 'rgba(99, 102, 241, 0.14)' : 'transparent', 
              borderRight: activeTab === 'health' ? '3.5px solid #6366f1' : '3.5px solid transparent',
              padding: '0.8rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.92rem', 
              fontWeight: activeTab === 'health' ? 700 : 500,
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Server size={18} style={{ color: activeTab === 'health' ? '#818cf8' : '#6b7280' }} />
              <span>صحة الخادم وحالة Uptime</span>
            </div>
            <span style={{ 
              fontSize: '0.75rem', 
              color: '#a855f7', 
              backgroundColor: 'rgba(168, 85, 247, 0.12)', 
              padding: '0.1rem 0.5rem', 
              borderRadius: '20px',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              fontWeight: 'bold'
            }}>99.98%</span>
          </button>

          <button 
            onClick={() => setActiveTab('logs')} 
            style={{ 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              textAlign: 'right', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '0.75rem', 
              width: '100%', 
              color: activeTab === 'logs' ? '#fff' : '#9ca3af', 
              backgroundColor: activeTab === 'logs' ? 'rgba(99, 102, 241, 0.14)' : 'transparent', 
              borderRight: activeTab === 'logs' ? '3.5px solid #6366f1' : '3.5px solid transparent',
              padding: '0.8rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.92rem', 
              fontWeight: activeTab === 'logs' ? 700 : 500,
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Terminal size={18} style={{ color: activeTab === 'logs' ? '#818cf8' : '#6b7280' }} />
              <span>سجل الأنشطة العام (Logs)</span>
            </div>
            <span style={{ 
              fontSize: '0.75rem', 
              color: '#3b82f6', 
              backgroundColor: 'rgba(59, 130, 246, 0.15)', 
              padding: '0.1rem 0.5rem', 
              borderRadius: '20px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontWeight: 'bold'
            }}>{stats?.activityLogs.length || 15} سجل</span>
          </button>

          <button 
            onClick={() => setActiveTab('security')} 
            style={{ 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              textAlign: 'right', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '0.75rem', 
              width: '100%', 
              color: activeTab === 'security' ? '#fff' : '#9ca3af', 
              backgroundColor: activeTab === 'security' ? 'rgba(99, 102, 241, 0.14)' : 'transparent', 
              borderRight: activeTab === 'security' ? '3.5px solid #6366f1' : '3.5px solid transparent',
              padding: '0.8rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.92rem', 
              fontWeight: activeTab === 'security' ? 700 : 500,
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={18} style={{ color: activeTab === 'security' ? '#818cf8' : '#6b7280' }} />
              <span>مركز الأمان والجلسات النشطة</span>
            </div>
            <span style={{ 
              fontSize: '0.75rem', 
              color: '#10b981', 
              backgroundColor: 'rgba(16, 185, 129, 0.15)', 
              padding: '0.1rem 0.5rem', 
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontWeight: 'bold',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.15)'
            }}>{stats?.sessions.activeCount || 1} نشط</span>
          </button>

          <button 
            onClick={() => setActiveTab('notifications')} 
            style={{ 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              textAlign: 'right', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '0.75rem', 
              width: '100%', 
              color: activeTab === 'notifications' ? '#fff' : '#9ca3af', 
              backgroundColor: activeTab === 'notifications' ? 'rgba(99, 102, 241, 0.14)' : 'transparent', 
              borderRight: activeTab === 'notifications' ? '3.5px solid #6366f1' : '3.5px solid transparent',
              padding: '0.8rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.92rem', 
              fontWeight: activeTab === 'notifications' ? 700 : 500,
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Bell size={18} style={{ color: activeTab === 'notifications' ? '#818cf8' : '#6b7280' }} />
              <span>مركز الإشعارات الجماعية</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab('settings')} 
            style={{ 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              textAlign: 'right', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '0.75rem', 
              width: '100%', 
              color: activeTab === 'settings' ? '#fff' : '#9ca3af', 
              backgroundColor: activeTab === 'settings' ? 'rgba(99, 102, 241, 0.14)' : 'transparent', 
              borderRight: activeTab === 'settings' ? '3.5px solid #6366f1' : '3.5px solid transparent',
              padding: '0.8rem 1rem', 
              borderRadius: '8px', 
              fontSize: '0.92rem', 
              fontWeight: activeTab === 'settings' ? 700 : 500,
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Settings size={18} style={{ color: activeTab === 'settings' ? '#818cf8' : '#6b7280' }} />
              <span>إعدادات المنصة والمسؤول</span>
            </div>
          </button>

        </nav>

        {/* Sidebar Footer profile */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
          backgroundColor: 'rgba(10, 10, 15, 0.6)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '10px', 
              backgroundColor: '#6366f1', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 800, 
              color: '#fff', 
              fontSize: '0.9rem',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)'
            }}>
              SA
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>مسؤول النظام</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#8b8ba0' }}>admin@saas.com</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              color: '#f87171', 
              cursor: 'pointer', 
              display: 'flex', 
              padding: '0.45rem', 
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            title="تسجيل الخروج"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <LogOut size={16} />
          </button>
        </div>

      </aside>

      {/* 2. Main Content Container Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {/* Top Sticky Navbar */}
        <header style={{ height: '70px', backgroundColor: '#10101b', borderBottom: '1px solid #1e1e2f', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 90 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
              {activeTab === 'dashboard' && 'الرئيسية والذكاء المالي المنصاتي'}
              {activeTab === 'businesses' && 'إدارة الأنشطة التجارية المشتركة (Tenants)'}
              {activeTab === 'billing' && 'إدارة باقات الفوترة والفواتير الخاصة بالمنصة'}
              {activeTab === 'users' && 'دليل أصحاب الأنشطة والتحكم بالحسابات'}
              {activeTab === 'support' && 'نظام معالجة الشكاوى وبطاقات الدعم الفني'}
              {activeTab === 'health' && 'المراقبة الفورية للأداء وصحة الخوادم'}
              {activeTab === 'logs' && 'سجلات الأحداث التاريخية للأمن والعمليات'}
              {activeTab === 'security' && 'مركز السيطرة الأمنية وجلسات الحسابات المباشرة'}
              {activeTab === 'notifications' && 'مركز إرسال الإشعارات الجماعية المباشرة'}
              {activeTab === 'settings' && 'إعدادات المنصة العامة وبيانات المدير العام'}
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={loadAllData} 
              className="btn btn-secondary" 
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} /> تحديث البيانات
            </button>
            <div style={{ borderRight: '1px solid #1e1e2f', height: '24px' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#151526', padding: '0.35rem 0.85rem', borderRadius: '30px', border: '1px solid #252538' }}>
              <Radio size={14} style={{ color: '#10b981' }} className="pulse" />
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 'bold' }}>سجل الأمان: مستقر</span>
            </div>
          </div>
        </header>

        {/* Dynamic Pages Area based on activeTab */}
        <div style={{ padding: '2rem', maxWidth: '1450px', width: '100%', margin: '0 auto' }}>
          
          {/* TAB 1: Main Dashboard (نظرة عامة والذكاء المالي) */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              {/* Business Stats Grid */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a5b4fc', marginBottom: '1rem', borderRight: '3px solid #6366f1', paddingRight: '0.5rem' }}>إحصائيات الأنشطة التجارية (Businesses)</h3>
              <div className="grid grid-5 mb-3" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.25rem' }}>
                
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10101b 0%, #151528 100%)', border: '1px solid #1e1e2f' }}>
                  <div className="stat-card-info">
                    <span className="stat-card-value">{loadingStats ? '...' : stats?.businesses.total}</span>
                    <span className="stat-card-label">إجمالي الأنشطة المسجلة</span>
                  </div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
                    <Building2 size={22} />
                  </div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10101b 0%, #122223 100%)', border: '1px solid #1c2e2e' }}>
                  <div className="stat-card-info">
                    <span className="stat-card-value" style={{ color: '#10b981' }}>{loadingStats ? '...' : stats?.businesses.active}</span>
                    <span className="stat-card-label">الأنشطة النشطة حالياً</span>
                  </div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                    <ShieldCheck size={22} />
                  </div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10101b 0%, #201a18 100%)', border: '1px solid #2d201a' }}>
                  <div className="stat-card-info">
                    <span className="stat-card-value" style={{ color: '#f59e0b' }}>{loadingStats ? '...' : stats?.businesses.suspended}</span>
                    <span className="stat-card-label">الأنشطة المجمدة</span>
                  </div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                    <AlertTriangle size={22} />
                  </div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10101b 0%, #151d2c 100%)', border: '1px solid #1c273a' }}>
                  <div className="stat-card-info">
                    <span className="stat-card-value" style={{ color: '#3b82f6' }}>{loadingStats ? '...' : stats?.businesses.trial}</span>
                    <span className="stat-card-label">الأنشطة التجريبية (Trial)</span>
                  </div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                    <Globe size={22} />
                  </div>
                </div>

                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10101b 0%, #26161c 100%)', border: '1px solid #3c1e26' }}>
                  <div className="stat-card-info">
                    <span className="stat-card-value" style={{ color: '#ef4444' }}>{loadingStats ? '...' : stats?.businesses.banned}</span>
                    <span className="stat-card-label">الأنشطة المحظورة</span>
                  </div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                    <ShieldAlert size={22} />
                  </div>
                </div>

              </div>

              {/* Financial Revenue Grid */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fca5a5', marginTop: '2rem', marginBottom: '1rem', borderRight: '3px solid #ef4444', paddingRight: '0.5rem' }}>الأداء المالي وإيرادات المنصة (Revenue)</h3>
              <div className="grid grid-6 mb-3" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '1.25rem' }}>
                
                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-value">{loadingStats ? '...' : stats?.revenue.today} {stats?.settings.currency}</span>
                    <span className="stat-card-label">أرباح اليوم</span>
                  </div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                    <TrendingUp size={20} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-value">{loadingStats ? '...' : stats?.revenue.month} {stats?.settings.currency}</span>
                    <span className="stat-card-label">أرباح الشهر الحالي</span>
                  </div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                    <TrendingUp size={20} />
                  </div>
                </div>

                <div className="stat-card" style={{ borderBottomColor: '#a855f7' }}>
                  <div className="stat-card-info">
                    <span className="stat-card-value" style={{ color: '#a855f7' }}>{loadingStats ? '...' : stats?.revenue.mrr} {stats?.settings.currency}</span>
                    <span className="stat-card-label">معدل العائد الشهري (MRR)</span>
                  </div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
                    <TrendingUp size={20} />
                  </div>
                </div>

                <div className="stat-card" style={{ borderBottomColor: '#ec4899' }}>
                  <div className="stat-card-info">
                    <span className="stat-card-value" style={{ color: '#ec4899' }}>{loadingStats ? '...' : stats?.revenue.arr} {stats?.settings.currency}</span>
                    <span className="stat-card-label">معدل العائد السنوي (ARR)</span>
                  </div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.12)', color: '#ec4899' }}>
                    <TrendingUp size={20} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-value">{loadingStats ? '...' : stats?.revenue.paidSubscriptions}</span>
                    <span className="stat-card-label">الاشتراكات المدفوعة الفعالة</span>
                  </div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
                    <CheckCircle size={20} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-value" style={{ color: '#10b981' }}>%{loadingStats ? '...' : stats?.revenue.renewalRate}</span>
                    <span className="stat-card-label">معدل تجديد الاشتراكات</span>
                  </div>
                  <div className="stat-card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                    <RefreshCw size={20} />
                  </div>
                </div>

              </div>

              {/* Graphic charts & quick dashboard logs */}
              <div className="grid grid-2 mb-3" style={{ gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem', marginTop: '2rem' }}>
                 {/* SVG Trendline Revenue Chart — Dynamic */}
                <div className="card" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f' }}>
                  <div className="card-header">
                    <h4 className="card-title">مخطط أداء الإيرادات ونمو الساس (Live SaaS Metrics Growth)</h4>
                    <span className="badge badge-success">مباشر ومحوسب</span>
                  </div>
                  <div style={{ height: '240px', width: '100%', position: 'relative', marginTop: '1.5rem' }}>
                    {loadingStats || !stats?.monthlyMetrics ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b8ba0' }}>جاري تحميل البيانات...</div>
                    ) : (() => {
                      const metrics: { month: string; revenue: number; tenants: number }[] = stats.monthlyMetrics;
                      const W = 500, H = 155, pad = 10;
                      const maxRev = Math.max(...metrics.map(m => m.revenue), 1);
                      const maxTen = Math.max(...metrics.map(m => m.tenants), 1);
                      const xStep = metrics.length > 1 ? (W - pad * 2) / (metrics.length - 1) : W;

                      const revPoints = metrics.map((m, i) => ({
                        x: pad + i * xStep,
                        y: H - pad - ((m.revenue / maxRev) * (H - pad * 2))
                      }));
                      const tenPoints = metrics.map((m, i) => ({
                        x: pad + i * xStep,
                        y: H - pad - ((m.tenants / maxTen) * (H - pad * 2))
                      }));

                      const toPath = (pts: {x:number;y:number}[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
                      const revPath = toPath(revPoints);
                      const tenPath = toPath(tenPoints);

                      return (
                        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
                          <defs>
                            <linearGradient id="mrrGrad2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Grid lines */}
                          {[0.25, 0.5, 0.75, 1].map(t => (
                            <line key={t} x1={pad} y1={pad + (1 - t) * (H - pad * 2)} x2={W - pad} y2={pad + (1 - t) * (H - pad * 2)} stroke="#1e1e2f" strokeWidth="0.6" strokeDasharray={t === 1 ? '0' : '3 3'} />
                          ))}

                          {/* Revenue area fill */}
                          <path d={`${revPath} L ${revPoints[revPoints.length - 1].x} ${H - pad} L ${revPoints[0].x} ${H - pad} Z`} fill="url(#mrrGrad2)" />

                          {/* Revenue trendline */}
                          <path d={revPath} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinejoin="round" />

                          {/* Tenants count trendline */}
                          <path d={tenPath} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" strokeLinejoin="round" />

                          {/* Dots + Labels */}
                          {revPoints.map((p, i) => (
                            <g key={i}>
                              <circle cx={p.x} cy={p.y} r="5" fill="#6366f1" stroke="#10101b" strokeWidth="2">
                                <title>{metrics[i].month}: {metrics[i].revenue} {stats?.settings?.currency}</title>
                              </circle>
                              {metrics[i].revenue > 0 && (
                                <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fill="#a5b4fc">
                                  {metrics[i].revenue}
                                </text>
                              )}
                            </g>
                          ))}
                          {tenPoints.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="#10101b" strokeWidth="2">
                              <title>{metrics[i].month}: {metrics[i].tenants} نشاط</title>
                            </circle>
                          ))}
                        </svg>
                      );
                    })()}
                  </div>
                  <div className="flex-between mt-2" style={{ fontSize: '0.8rem', color: '#8b8ba0' }}>
                    {stats?.monthlyMetrics?.map((m: any, i: number) => (
                      <span key={i}>{m.month}</span>
                    )) ?? ['الربع 1', 'الربع 2', 'الربع 3', 'الحالي'].map(l => <span key={l}>{l}</span>)}
                  </div>
                  <div className="flex-center mt-1" style={{ gap: '1.5rem', fontSize: '0.78rem', color: '#8b8ba0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 12, height: 3, backgroundColor: '#6366f1', display: 'inline-block', borderRadius: 2 }} /> الإيرادات
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 12, height: 3, backgroundColor: '#10b981', display: 'inline-block', borderRadius: 2, borderTop: '2px dashed #10b981' }} /> نمو الأنشطة
                    </span>
                  </div>
                </div>


                {/* Dashboard live activity feed */}
                <div className="card" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f', display: 'flex', flexDirection: 'column' }}>
                  <div className="card-header" style={{ marginBottom: '1rem' }}>
                    <h4 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Radio size={16} style={{ color: '#6366f1' }} className="pulse" />
                      <span>آخر الأحداث الفورية (Recent Activity Feed)</span>
                    </h4>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '250px' }}>
                    {loadingStats ? (
                      <div className="text-center py-3">جاري تحميل الأحداث...</div>
                    ) : stats?.activityLogs.slice(0, 5).map((log: any) => (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: '#161625', borderRadius: '8px', border: '1px solid #1e1e2f', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#6366f1' }}>[{log.action}]</span>
                          <p style={{ margin: '0.2rem 0 0', color: '#ccc' }}>{log.target}</p>
                        </div>
                        <div style={{ textAlign: 'end', fontSize: '0.75rem', color: '#8b8ba0' }}>
                          <div>{log.operator}</div>
                          <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: Businesses Management (إدارة الأنشطة والشركات) */}
          {activeTab === 'businesses' && (
            <div className="animate-fade-in">
              <div className="flex-between mb-2">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>دليل المتاجر والشركات المشتركة (Tenants Directory)</h3>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setIsEditMode(false);
                    setEditTenantId(null);
                    setNewBizName('');
                    setNewBizType('gym');
                    setNewBizCurrency('SAR');
                    setNewBizPlan(platformPlans.length > 0 ? platformPlans[0].name : 'Premium');
                    setNewBizLanguage('ar');
                    setNewBizEmail('');
                    setNewBizPassword('');
                    setShowAddModal(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Plus size={16} /> تهيئة منشأة تجارية جديدة
                </button>
              </div>

              {/* Tenants Data Table */}
              <div className="table-container" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem' }}>
                <table className="table">
                  <thead>
                    <tr style={{ backgroundColor: '#161625' }}>
                      <th style={{ color: '#fff' }}>اسم المنشأة</th>
                      <th>نوع النشاط</th>
                      <th>حالة الاشتراك</th>
                      <th>الخطة الحالية</th>
                      <th>المستخدمين</th>
                      <th>العملاء والمشتركين</th>
                      <th>تاريخ الإنشاء</th>
                      <th style={{ textAlign: 'center' }}>العمليات الإدارية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTenants ? (
                      <tr>
                        <td colSpan={8} className="text-center py-3">جاري جلب معلومات الأنشطة وحساب تفاصيل النسخ الاحتياطية...</td>
                      </tr>
                    ) : tenants.map(tenant => {
                      const bizConfig = BUSINESS_TYPES[tenant.type] || BUSINESS_TYPES.custom;
                      const isExpired = tenant.expiryDate ? (tenant.expiryDate < new Date().toISOString().split('T')[0]) : false;
                      
                      return (
                        <tr key={tenant.id}>
                          <td style={{ fontWeight: 'bold', color: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#1c1c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                                {bizConfig.icon}
                              </div>
                              <div>
                                <span>{tenant.name}</span>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#8b8ba0', fontWeight: 'normal' }}>{tenant.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', backgroundColor: '#171725', border: '1px solid #232338', fontSize: '0.85rem' }}>
                              {bizConfig.nameAr}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${
                              tenant.status === 'active' ? 'badge-success' : 
                              tenant.status === 'trial' ? 'badge-info' : 
                              tenant.status === 'banned' ? 'badge-danger' : 'badge-warning'
                            }`}>
                              {tenant.status === 'active' && 'نشط'}
                              {tenant.status === 'trial' && 'تجريبي'}
                              {tenant.status === 'suspended' && 'مجمد'}
                              {tenant.status === 'frozen' && 'مجمد'}
                              {tenant.status === 'banned' && 'محظور'}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-warning" style={{ color: '#fff', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                              {tenant.plan}
                            </span>
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{tenant.userCount} مستخدمين</td>
                          <td style={{ fontWeight: 'bold', color: '#6366f1' }}>{tenant.customerCount} عميل</td>
                          <td style={{ fontSize: '0.8rem', color: '#8b8ba0' }}>
                            {new Date(tenant.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            {tenant.status === 'active' || tenant.status === 'trial' ? (
                              <button 
                                className="btn btn-secondary"
                                onClick={() => handleImpersonate(tenant)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.4rem 0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.2)' }}
                                title="تسجيل الدخول التقمصي لمركز العميل"
                              >
                                <UserCheck size={13} /> دخول كمالك
                              </button>
                            ) : (
                              <button 
                                className="btn btn-secondary" 
                                disabled
                                style={{ opacity: 0.5, cursor: 'not-allowed', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                              >
                                <UserCheck size={13} /> دخول كمالك
                              </button>
                            )}

                            <button 
                              className="btn btn-secondary"
                              onClick={() => {
                                setIsEditMode(true);
                                setEditTenantId(tenant.id);
                                setNewBizName(tenant.name);
                                setNewBizType(tenant.type);
                                setNewBizCurrency(tenant.currency);
                                setNewBizPlan(tenant.plan);
                                setNewBizLanguage(tenant.language as 'ar' | 'en');
                                setNewBizEmail(tenant.email);
                                setNewBizPassword('');
                                setShowAddModal(true);
                              }}
                              style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Edit2 size={13} />
                            </button>

                            <button 
                              className="btn btn-secondary"
                              onClick={() => {
                                setCustTenantId(tenant.id);
                                setCustTenantName(tenant.name);
                                setCustPlan(tenant.plan);
                                setCustPeriod(tenant.subscriptionPeriod || 'monthly');
                                setCustPrice(tenant.subscriptionPrice !== null ? tenant.subscriptionPrice.toString() : '');
                                setCustExpiry(tenant.expiryDate || '');
                                setShowCustModal(true);
                              }}
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' }}
                            >
                              الاشتراك
                            </button>

                            {tenant.status === 'active' ? (
                              <button 
                                className="btn btn-secondary"
                                onClick={() => handleToggleTenantStatus(tenant.id, 'active', 'suspended')}
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              >
                                تجميد
                              </button>
                            ) : (
                              <button 
                                className="btn btn-success"
                                onClick={() => handleToggleTenantStatus(tenant.id, tenant.status, 'active')}
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                              >
                                تفعيل
                              </button>
                            )}

                            <button 
                              className="btn btn-danger"
                              onClick={() => handleDeleteTenant(tenant.id)}
                              style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {tenants.length === 0 && !loadingTenants && (
                      <tr>
                        <td colSpan={8} className="text-center py-5">لا توجد منشآت تجارية مسجلة بالمنصة حتى الآن.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Platform Subscription & Billing Management */}
          {activeTab === 'billing' && (
            <div className="animate-fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Platform Plans Management */}
                <div>
                  <div className="flex-between mb-2">
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>باقات المنصة (Plans)</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      setIsPlanEditMode(false);
                      setEditPlanId(null);
                      setPlanName('');
                      setPlanPrice(199);
                      setPlanPeriod('monthly');
                      setPlanCurrency('SAR');
                      setPlanFeatures('');
                      setShowPlanModal(true);
                    }}>
                      <Plus size={14} /> باقة جديدة
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    {platformPlans.map(plan => (
                      <div key={plan.id} className="card" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f', padding: '1.25rem' }}>
                        <div className="flex-between">
                          <h4 style={{ fontWeight: 'bold', color: '#fff' }}>{plan.name}</h4>
                          <span className="badge badge-primary">
                            {plan.period === 'yearly' ? 'سنوي' : 
                             plan.period === 'monthly' ? 'شهري' : 
                             plan.period.endsWith('d') ? `${plan.period.replace('d', '')} يوم` :
                             plan.period.endsWith('m') ? `${plan.period.replace('m', '')} شهر` :
                             plan.period}
                          </span>
                        </div>
                        <p style={{ fontSize: '1.45rem', fontWeight: 800, color: '#6366f1', margin: '0.5rem 0' }}>
                          {plan.price} {plan.currency || 'SAR'}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#8b8ba0' }}>{plan.features}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #1e1e2f', paddingTop: '0.75rem' }}>
                          <button className="btn btn-secondary btn-sm w-100" onClick={() => {
                            setIsPlanEditMode(true);
                            setEditPlanId(plan.id);
                            setPlanName(plan.name);
                            setPlanPrice(plan.price);
                            setPlanPeriod(plan.period);
                            setPlanCurrency(plan.currency || 'SAR');
                            setPlanFeatures(plan.features);
                            setShowPlanModal(true);
                          }}>تعديل</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeletePlatformPlan(plan.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Ledger Billing, Invoices & Payments */}
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>سجل الفواتير والدفع والعمليات المالية</h3>
                  <div className="table-container" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>المنشأة</th>
                          <th>قيمة الفاتورة</th>
                          <th>طريقة الدفع</th>
                          <th>تاريخ الدفعة</th>
                          <th>الحالة المالية</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.revenue.today === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-3">لا توجد عمليات مسجلة في الدفتر بعد.</td>
                          </tr>
                        )}
                        {tenants.slice(0, 6).map((t, idx) => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 'bold' }}>{t.name}</td>
                            <td>{t.subscriptionPrice || 399} SAR</td>
                            <td>بطاقة ائتمانية (Mada/Visa)</td>
                            <td>{new Date(Date.now() - idx * 86400000).toLocaleDateString()}</td>
                            <td>
                              <span className="badge badge-success">مدفوعة بالكامل</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: General Users Management (إدارة المستخدمين العامة) */}
          {activeTab === 'users' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>سجل أصحاب الأنشطة والمدراء الفنيين</h3>
              
              <div className="table-container" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>اسم صاحب النشاط / العميل</th>
                      <th>المنشأة التجارية</th>
                      <th>البريد الإلكتروني</th>
                      <th>حالة الاتصال والبريد</th>
                      <th>تاريخ الاشتراك</th>
                      <th style={{ textAlign: 'center' }}>العمليات الأمنية والحساب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={6} className="text-center py-3">جاري استرجاع مستخدمي الأنشطة...</td>
                      </tr>
                    ) : usersList.map(user => (
                      <tr key={user.id}>
                        <td style={{ fontWeight: 'bold', color: '#fff' }}>{user.name} (المالك)</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <span className="badge badge-success">بريد مؤكد</span>
                            <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                              {user.status === 'active' ? 'حساب نشط' : 'حساب معلق'}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#8b8ba0' }}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              const pass = prompt('ادخل كلمة المرور الجديدة لهذا الحساب:');
                              if (pass) handleUserAction(user.id, 'reset_password', pass);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.2)' }}
                          >
                            <Key size={12} /> كلمة السر
                          </button>
                          
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleUserAction(user.id, 'force_logout')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <LogOut size={12} /> طرد الجلسة
                          </button>

                          {user.status === 'active' ? (
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleUserAction(user.id, 'suspend')}
                              style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}
                            >
                              تعليق الحساب
                            </button>
                          ) : (
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => handleUserAction(user.id, 'activate')}
                            >
                              تنشيط
                            </button>
                          )}

                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleUserAction(user.id, 'ban')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          >
                            <UserX size={12} /> حظر (Ban)
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Support & Tickets (نظام الدعم والتذاكر المتكامل) */}
          {activeTab === 'support' && (
            <div className="animate-fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Tickets list */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>صندوق تذاكر الدعم والشكاوى (Technical Support Tickets)</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loadingTickets ? (
                      <div className="text-center py-3">جاري تحميل تذاكر الدعم الفني...</div>
                    ) : ticketsList.map(ticket => (
                      <div 
                        key={ticket.id} 
                        className="card" 
                        style={{ 
                          backgroundColor: '#10101b', 
                          borderColor: ticket.status === 'open' ? 'rgba(99, 102, 241, 0.4)' : '#1e1e2f',
                          borderLeftWidth: '4px',
                          borderLeftColor: ticket.priority === 'high' ? '#ef4444' : ticket.priority === 'medium' ? '#f59e0b' : '#3b82f6'
                        }}
                      >
                        <div className="flex-between">
                          <div>
                            <span className="badge badge-secondary" style={{ marginBottom: '0.5rem', backgroundColor: '#171725' }}>
                              {ticket.type === 'complaint' && 'شكوى'}
                              {ticket.type === 'problem' && 'مشكلة تقنية'}
                              {ticket.type === 'request' && 'طلب ميزة'}
                            </span>
                            <span className="badge badge-danger" style={{ marginRight: '0.5rem' }}>
                              {ticket.priority === 'high' ? 'عالية الأهمية' : ticket.priority === 'medium' ? 'متوسطة الأهمية' : 'منخفضة'}
                            </span>
                          </div>
                          
                          <span className={`badge ${ticket.status === 'resolved' ? 'badge-success' : ticket.status === 'in_progress' ? 'badge-warning' : 'badge-danger'}`}>
                            {ticket.status === 'resolved' && 'تم الحل'}
                            {ticket.status === 'in_progress' && 'قيد المعالجة'}
                            {ticket.status === 'open' && 'مفتوحة حديثاً'}
                          </span>
                        </div>

                        <h4 style={{ color: '#fff', fontWeight: 'bold', margin: '0.5rem 0' }}>{ticket.subject}</h4>
                        <p style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: '1.6' }}>{ticket.description}</p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid #1e1e2f', paddingTop: '0.75rem', fontSize: '0.8rem', color: '#8b8ba0' }}>
                          <span>المنشأة: <strong style={{ color: '#fff' }}>{ticket.tenantName}</strong></span>
                          <span>تم الإنشاء: {new Date(ticket.createdAt).toLocaleString()}</span>
                        </div>

                        {ticket.reply && (
                          <div style={{ marginTop: '1rem', padding: '0.85rem', backgroundColor: '#181829', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem' }}>
                            <strong style={{ color: '#10b981', display: 'block', marginBottom: '0.25rem' }}>رد المسؤول:</strong>
                            <p style={{ color: '#d1d5db', margin: 0 }}>{ticket.reply}</p>
                          </div>
                        )}

                        {ticket.status !== 'resolved' && (
                          <button 
                            className="btn btn-primary btn-sm mt-3"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setTicketReplyText('');
                              setShowTicketModal(true);
                            }}
                          >
                            الرد وحل التذكرة
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Support Troubleshooting Logs Database */}
                <div>
                  <div className="flex-between mb-2">
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>سجل الحلول والمشاكل الفنية</h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowLogModal(true)}>
                      <Plus size={14} /> إضافة سجل
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
                    {ticketLogs.map(log => (
                      <div key={log.id} className="card" style={{ backgroundColor: '#10101b', borderColor: log.type === 'problem' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', padding: '1rem' }}>
                        <span className={`badge ${log.type === 'problem' ? 'badge-danger' : 'badge-success'}`} style={{ marginBottom: '0.5rem' }}>
                          {log.type === 'problem' ? 'سجل مشكلة' : 'سجل حل معتمد'}
                        </span>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' }}>{log.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#ccc', marginTop: '0.4rem', lineHeight: '1.5' }}>{log.content}</p>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#8b8ba0', marginTop: '0.75rem', textAlign: 'end' }}>
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Server Health & Monitoring (مراقبة الخادم والأعطال) */}
          {activeTab === 'health' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>مراقبة موارد خادم الويب وقواعد البيانات (Server Resources Health)</h3>
              
              {/* Circular Radial Gauges */}
              <div className="grid grid-4 mb-3" style={{ gap: '1.5rem' }}>
                
                <div className="card text-center" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f', padding: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: simulatedCpu > 70 ? '#ef4444' : simulatedCpu > 40 ? '#f59e0b' : '#10b981' }}>
                    %{simulatedCpu}
                  </div>
                  <h4 style={{ fontWeight: 'bold', color: '#fff', marginTop: '0.75rem' }}>استهلاك المعالج (CPU Load)</h4>
                  <div className="progress-bar-container" style={{ width: '100%', height: '6px', backgroundColor: '#23233b', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
                    <div style={{ width: `${simulatedCpu}%`, height: '100%', backgroundColor: simulatedCpu > 70 ? '#ef4444' : '#10b981', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>

                <div className="card text-center" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f', padding: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f59e0b' }}>
                    %{simulatedRam}
                  </div>
                  <h4 style={{ fontWeight: 'bold', color: '#fff', marginTop: '0.75rem' }}>ذاكرة الوصول العشوائي (RAM)</h4>
                  <div className="progress-bar-container" style={{ width: '100%', height: '6px', backgroundColor: '#23233b', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
                    <div style={{ width: `${simulatedRam}%`, height: '100%', backgroundColor: '#f59e0b', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>

                <div className="card text-center" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f', padding: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981' }}>
                    %42
                  </div>
                  <h4 style={{ fontWeight: 'bold', color: '#fff', marginTop: '0.75rem' }}>المساحة التخزينية (Disk)</h4>
                  <div className="progress-bar-container" style={{ width: '100%', height: '6px', backgroundColor: '#23233b', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
                    <div style={{ width: '42%', height: '100%', backgroundColor: '#10b981' }}></div>
                  </div>
                </div>

                <div className="card text-center" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f', padding: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981' }}>
                    %{simulatedDbLoad}
                  </div>
                  <h4 style={{ fontWeight: 'bold', color: '#fff', marginTop: '0.75rem' }}>حمل استعلامات DB Load</h4>
                  <div className="progress-bar-container" style={{ width: '100%', height: '6px', backgroundColor: '#23233b', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
                    <div style={{ width: `${simulatedDbLoad}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>

              </div>

              {/* Uptime details & Live streamer log terminal console */}
              <div className="grid grid-2" style={{ gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem', marginTop: '2rem' }}>
                {/* Uptime & Crashes logs */}
                <div className="card" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f' }}>
                  <h4 style={{ fontWeight: 'bold', color: '#fff', marginBottom: '1rem' }}>سجل الأعطال النشط والوظائف الفاشلة (Crashes & Failed Jobs)</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {stats?.system.errorsList.map((err: any) => (
                      <div key={err.id} style={{ padding: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#ef4444' }}>
                          <span>{err.type === 'backend_error' ? 'خطأ سيرفر (Backend)' : 'وظيفة مجدولة فاشلة'}</span>
                          <span>مرات التكرار: {err.count}</span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0', color: '#d1d5db' }}>{err.message}</p>
                        <small style={{ color: '#8b8ba0', display: 'block', marginTop: '0.25rem' }}>{new Date(err.createdAt).toLocaleTimeString()}</small>
                      </div>
                    ))}
                    {stats?.system.errorsList.length === 0 && (
                      <div className="text-center py-4 text-muted">لا توجد أعطال حالياً بالخادم. النظام مستقر بنسبة 100%.</div>
                    )}
                  </div>
                </div>

                {/* Animated real-time logs console */}
                <div className="card" style={{ backgroundColor: '#000', borderColor: '#1f1f33', display: 'flex', flexDirection: 'column' }}>
                  <div className="card-header" style={{ borderBottom: '1px solid #1c1c2e', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} className="pulse"></span>
                      <span>SaaS Engine Terminal Logs streamer</span>
                    </h4>
                  </div>
                  <div style={{ flex: 1, maxHeight: '250px', overflowY: 'auto', padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#34d399', display: 'flex', flexDirection: 'column', gap: '0.25rem', direction: 'ltr', textAlign: 'left' }}>
                    {simulatedLiveLogs.map((log, index) => (
                      <div key={index} style={{ whiteSpace: 'pre-wrap' }}>{log}</div>
                    ))}
                    <div ref={consoleEndRef} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Activity Logs (سجل الأنشطة) */}
          {activeTab === 'logs' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>سجل الأنشطة والعمليات التاريخية بالكامل (Platform Global Audit Trail)</h3>
              
              <div className="table-container" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>العملية الأمنية / الحركة</th>
                      <th>المسؤول / المشغل</th>
                      <th>المنشأة المستهدفة (Target)</th>
                      <th>عنوان الـ IP</th>
                      <th>الوقت والتاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingStats ? (
                      <tr>
                        <td colSpan={5} className="text-center py-3">جاري استرجاع سجل الأنشطة...</td>
                      </tr>
                    ) : stats?.activityLogs.map((log: any) => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 'bold', color: '#fff' }}>
                          <span className="badge badge-primary" style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                            {log.action}
                          </span>
                        </td>
                        <td>{log.operator}</td>
                        <td style={{ fontWeight: 'bold' }}>{log.target}</td>
                        <td style={{ fontFamily: 'monospace' }}>{log.ip || '127.0.0.1'}</td>
                        <td style={{ fontSize: '0.85rem', color: '#8b8ba0' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: Security Center (مركز الأمان والجلسات) */}
          {activeTab === 'security' && (
            <div className="animate-fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }}>
                {/* Security features checkboxes */}
                <div className="card" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem', color: '#fff' }}>ميزات الحماية الجدارية والأمان (Security Configurations)</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div className="flex-between">
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block' }}>المصادقة ثنائية العاملين (2FA) للمشتركين</strong>
                        <span style={{ fontSize: '0.8rem', color: '#8b8ba0' }}>مطالبة كافة أصحاب الحسابات بتأكيد هويتهم بمطابقة الهاتف.</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={twoFactorEnabled} 
                        onChange={(e) => handleToggleSecurityOption('twoFactor', e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                    </div>

                    <div className="flex-between">
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block' }}>رصد محاولات الدخول المشبوهة</strong>
                        <span style={{ fontSize: '0.8rem', color: '#8b8ba0' }}>تعليق حسابات المشتركين مؤقتاً عند استشعار تسجيل دخول من متصفحات غريبة.</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={suspiciousLoginEnabled} 
                        onChange={(e) => handleToggleSecurityOption('suspicious', e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                    </div>

                    <div className="flex-between">
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block' }}>محاذاة قيود الـ IP للمدراء (IP Restrictions)</strong>
                        <span style={{ fontSize: '0.8rem', color: '#8b8ba0' }}>منع الدخول لبوابة المشرفين العامة من خارج عناوين الـ IP الموثوقة.</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={ipRestrictionsEnabled} 
                        onChange={(e) => handleToggleSecurityOption('ipRestrict', e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                    </div>

                    {ipRestrictionsEnabled && (
                      <div className="form-group" style={{ marginTop: '0.5rem', padding: '0.85rem', backgroundColor: '#171725', borderRadius: '8px', border: '1px solid #232338' }}>
                        <label className="form-label">عناوين الـ IP المصرح لها (مفصولة بفاصلة)</label>
                        <input type="text" className="form-input" style={{ fontSize: '0.85rem' }} defaultValue="127.0.0.1, 192.168.1.1" />
                      </div>
                    )}

                  </div>
                </div>

                {/* Active Sessions & Terminators */}
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>جلسات العمل النشطة بالمنصة (Active Live Sessions)</h3>
                  <div className="table-container" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>الحساب</th>
                          <th>الصلاحيات</th>
                          <th>عنوان IP الجلسة</th>
                          <th>متصفح الدخول</th>
                          <th>آخر نشاط</th>
                          <th style={{ textAlign: 'center' }}>الإجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {securityData?.sessions.map((sess: any) => (
                          <tr key={sess.id}>
                            <td style={{ fontWeight: 'bold', color: '#fff' }}>{sess.email}</td>
                            <td>
                              <span className="badge badge-success">
                                {sess.role === 'super_admin' ? 'مدير المنصة' : 'صاحب منشأة'}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'monospace' }}>{sess.ip}</td>
                            <td style={{ fontSize: '0.78rem', color: '#ccc', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sess.userAgent}>
                              {sess.userAgent.slice(0, 30)}...
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#8b8ba0' }}>
                              {new Date(sess.lastActive).toLocaleTimeString()}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleTerminateSession(sess.id)}
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                              >
                                طرد الجلسة
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: Broadcast Notification Center (إرسال إشعارات جماعية) */}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in" style={{ maxWidth: '750px', margin: '0 auto' }}>
              <div className="card animate-fade-in" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f', padding: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #1e1e2f', paddingBottom: '1rem' }}>
                  <Bell size={24} style={{ color: '#6366f1' }} />
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 800, color: '#fff' }}>مركز بث الإشعارات الجماعية للأنشطة والمنشآت</h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#8b8ba0' }}>بث رسالة موحدة فورية تظهر لجميع أصحاب الأنشطة النشطين في لوحة التحكم وتحديث قواعد البيانات.</p>
                  </div>
                </div>

                <form onSubmit={handleSendBroadcast}>
                  <div className="form-group">
                    <label className="form-label">نوع البث / الإشعار</label>
                    <select 
                      className="form-select"
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as 'maintenance' | 'update')}
                    >
                      <option value="update">تحديث الميزات البرمجية (SaaS Feature Update)</option>
                      <option value="maintenance">تنبيه صيانة أو توقف سيرفرات (Server Maintenance Alert)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label className="form-label">عنوان البث الرئيسي</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="مثال: ترقية المنصة للإصدار 2.4 وإدراج ميزة الحضور التلقائي بالباركود"
                      value={broadcastTitle}
                      onChange={e => setBroadcastTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label className="form-label">نص ومضمون البث بالتفصيل</label>
                    <textarea 
                      className="form-textarea" 
                      rows={5}
                      placeholder="صف بالتفصيل ما سيتم إجراؤه في الصيانة أو ما تم إدراجه من مميزات..."
                      value={broadcastMessage}
                      onChange={e => setBroadcastMessage(e.target.value)}
                      required
                    />
                  </div>

                  {broadcastStatusMessage && (
                    <div className="alert alert-info" style={{ marginTop: '1.25rem', padding: '0.85rem' }}>
                      <Radio size={16} className="pulse" style={{ color: '#6366f1' }} />
                      <span>{broadcastStatusMessage}</span>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary w-100" style={{ padding: '0.85rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Send size={16} /> بث الإشعار فوراً إلى الجميع
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 10: SaaS Platform Settings & Admin Profile (إعدادات المنصة والمسؤول) */}
          {activeTab === 'settings' && (
            <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>

              {/* Sub-tab navigation */}
              <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', background: '#10101b', border: '1px solid #1e1e2f', borderRadius: '12px', padding: '4px' }}>
                {[
                  { key: 'config', label: 'إعدادات النشاط', icon: '⚙️' },
                  { key: 'security', label: 'الحساب والأمان', icon: '🔒' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setSaasSettingsTab(tab.key as any); setSaasPasswordError(''); setSaasPasswordSuccess(''); }}
                    style={{
                      flex: 1,
                      padding: '0.7rem 1.25rem',
                      borderRadius: '9px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                      backgroundColor: saasSettingsTab === tab.key ? '#6366f1' : 'transparent',
                      color: saasSettingsTab === tab.key ? '#fff' : '#8b8ba0',
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <div className="card" style={{ backgroundColor: '#10101b', borderColor: '#1e1e2f', padding: '2.5rem' }}>

                {/* SUB-TAB: Platform Config */}
                {saasSettingsTab === 'config' && (
                  <form onSubmit={handleSaveSaaSConfig}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', borderBottom: '1px solid #1e1e2f', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                      إعدادات المنصة العامة (SaaS Global Configurations)
                    </h3>
                    
                    <div className="grid grid-2" style={{ gap: '1.25rem' }}>
                      <div className="form-group">
                        <label className="form-label">اسم منصة الساس (Platform Name)</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={saasPlatformName}
                          onChange={e => setSaasPlatformName(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">نسبة الضريبة القومية الافتراضية (%)</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={saasTaxes}
                          onChange={e => setSaasTaxes(parseFloat(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-2" style={{ gap: '1.25rem', marginTop: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">العملة الافتراضية للمنصة</label>
                        <select 
                          className="form-select"
                          value={saasCurrency}
                          onChange={e => setSaasCurrency(e.target.value)}
                        >
                          <option value="SAR">SAR (ريال سعودي)</option>
                          <option value="JOD">JOD (دينار أردني)</option>
                          <option value="AED">AED (درهم إماراتي)</option>
                          <option value="USD">USD (دولار أمريكي)</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">اللغة الافتراضية المعتمدة</label>
                        <select 
                          className="form-select"
                          value={saasLanguage}
                          onChange={e => setSaasLanguage(e.target.value)}
                        >
                          <option value="ar">العربية (Arabic - RTL)</option>
                          <option value="en">English (LTR)</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem', marginTop: '2rem', display: 'block', marginRight: 'auto' }}>
                      حفظ إعدادات المنصة
                    </button>
                  </form>
                )}

                {/* SUB-TAB: Account & Security */}
                {saasSettingsTab === 'security' && (
                  <form onSubmit={handleSaveSaaSConfig}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', borderBottom: '1px solid #1e1e2f', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                      الحساب والأمان — Super Admin Profile
                    </h3>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                      <label className="form-label">البريد الإلكتروني للمسؤول</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={saasAdminEmail}
                        onChange={e => setSaasAdminEmail(e.target.value)}
                        required
                      />
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#8b8ba0', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🔑 تغيير كلمة المرور (اختياري)
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1.25rem' }}>
                      اتركها فارغة إذا لم ترغب في تغيير كلمة المرور الحالية.
                    </p>

                    <div className="form-group" style={{ marginBottom: '1.1rem' }}>
                      <label className="form-label">كلمة المرور الحالية</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="••••••••"
                        value={saasCurrentPassword}
                        onChange={e => setSaasCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                    </div>

                    <div className="grid grid-2" style={{ gap: '1.1rem', marginBottom: '1.1rem' }}>
                      <div className="form-group">
                        <label className="form-label">كلمة المرور الجديدة</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••"
                          value={saasNewPassword}
                          onChange={e => setSaasNewPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">تأكيد كلمة المرور الجديدة</label>
                        <input 
                          type="password" 
                          className="form-input"
                          placeholder="••••••••"
                          value={saasConfirmPassword}
                          onChange={e => setSaasConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    {saasPasswordError && (
                      <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ⚠️ {saasPasswordError}
                      </div>
                    )}
                    {saasPasswordSuccess && (
                      <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ✅ {saasPasswordSuccess}
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem', marginTop: '0.5rem', display: 'block', marginRight: 'auto' }}>
                      حفظ بيانات الحساب والأمان
                    </button>
                  </form>
                )}

              </div>
            </div>
          )}


        </div>
      </main>

      {/* --- MODAL 1: ADD/EDIT TENANT BUSINESS MODAL --- */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: '560px', border: '1px solid var(--border-color)', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} style={{ color: '#6366f1' }} />
                <h3 style={{ margin: 0, fontWeight: 800, color: '#fff' }}>{isEditMode ? 'تعديل بيانات المنشأة التجارية' : 'إنشاء وتهيئة نشاط تجاري جديد'}</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveTenant}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="form-group">
                  <label className="form-label">اسم المنشأة / النشاط التجاري</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="مثال: أكاديمية المحترفين لكرة القدم" 
                    value={newBizName}
                    onChange={e => setNewBizName(e.target.value)}
                    required 
                  />
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">نوع النشاط</label>
                    <select 
                      className="form-select"
                      value={newBizType}
                      onChange={e => setNewBizType(e.target.value)}
                    >
                      {Object.entries(BUSINESS_TYPES).map(([key, config]) => (
                        <option key={key} value={key}>{config.icon} {config.nameAr}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">العملة الافتراضية</label>
                    <select 
                      className="form-select"
                      value={newBizCurrency}
                      onChange={e => setNewBizCurrency(e.target.value)}
                    >
                      <option value="SAR">SAR (ريال سعودي)</option>
                      <option value="JOD">JOD (دينار أردني)</option>
                      <option value="AED">AED (درهم إماراتي)</option>
                      <option value="USD">USD (دولار أمريكي)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">باقة الاشتراك</label>
                    <select 
                      className="form-select"
                      value={newBizPlan}
                      onChange={e => setNewBizPlan(e.target.value)}
                    >
                      {platformPlans.map(p => (
                        <option key={p.id} value={p.name}>{p.name} ({p.price} SAR)</option>
                      ))}
                      {platformPlans.length === 0 && (
                        <>
                          <option value="Basic">Basic (199 SAR)</option>
                          <option value="Premium">Premium (399 SAR)</option>
                          <option value="Enterprise">Enterprise (699 SAR)</option>
                          <option value="Trial">Trial (فترة تجريبية مجانية)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">لغة النظام الافتراضية</label>
                    <select 
                      className="form-select"
                      value={newBizLanguage}
                      onChange={e => setNewBizLanguage(e.target.value as 'ar' | 'en')}
                    >
                      <option value="ar">العربية (RTL)</option>
                      <option value="en">English (LTR)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني لمالك العمل</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="owner@example.com"
                    value={newBizEmail}
                    onChange={e => setNewBizEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">كلمة المرور للمالك</label>
                  <input 
                    type="password" 
                    className="form-input"
                    placeholder={isEditMode ? "اتركه فارغاً للاحتفاظ بكلمة السر الحالية" : "••••••••"}
                    value={newBizPassword}
                    onChange={e => setNewBizPassword(e.target.value)}
                    required={!isEditMode}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>
                  {isEditMode ? 'حفظ التعديلات' : 'إنشاء وتدشين المنشأة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CUSTOMIZE SUBSCRIPTION PROPERTIES --- */}
      {showCustModal && (
        <div className="modal-overlay" onClick={() => setShowCustModal(false)}>
          <div className="modal" style={{ maxWidth: '500px', border: '1px solid var(--border-color)', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} style={{ color: '#f59e0b' }} />
                <h3 style={{ margin: 0, fontWeight: 800, color: '#fff' }}>تخصيص وفوترة الاشتراك: {custTenantName}</h3>
              </div>
              <button onClick={() => setShowCustModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCustSubscription}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div className="form-group">
                  <label className="form-label">باقة الاشتراك</label>
                  <select 
                    className="form-select"
                    value={custPlan}
                    onChange={e => setCustPlan(e.target.value)}
                  >
                    {platformPlans.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                    {platformPlans.length === 0 && (
                      <>
                        <option value="Basic">Basic</option>
                        <option value="Premium">Premium</option>
                        <option value="Enterprise">Enterprise</option>
                        <option value="Trial">Trial</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">دورة الدفع</label>
                    <select 
                      className="form-select"
                      value={
                        custPeriod === 'monthly' || custPeriod === 'yearly'
                          ? custPeriod
                          : custPeriod.endsWith('d')
                          ? 'custom_days'
                          : custPeriod.endsWith('m')
                          ? 'custom_months'
                          : 'monthly'
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'monthly' || val === 'yearly') {
                          setCustPeriod(val);
                        } else if (val === 'custom_days') {
                          setCustPeriod(`${customCustPeriodDays}d`);
                        } else if (val === 'custom_months') {
                          setCustPeriod(`${customCustPeriodMonths}m`);
                        }
                      }}
                    >
                      <option value="monthly">شهري</option>
                      <option value="yearly">سنوي</option>
                      <option value="custom_days">عدد أيام مخصص</option>
                      <option value="custom_months">عدد أشهر مخصص</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">سعر اشتراك مخصص شهرياً (SAR)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="اتركه فارغاً للتسعير التلقائي"
                      value={custPrice}
                      onChange={e => setCustPrice(e.target.value)}
                    />
                  </div>
                </div>

                {(custPeriod.endsWith('d') || custPeriod === 'custom_days') && (
                  <div className="form-group animate-fade-in" style={{ transition: 'all 0.3s' }}>
                    <label className="form-label">عدد الأيام المخصصة لدورة الدفع</label>
                    <input 
                      type="number" 
                      min={1}
                      className="form-input" 
                      value={
                        custPeriod.endsWith('d') 
                          ? parseInt(custPeriod.replace('d', '')) || customCustPeriodDays 
                          : customCustPeriodDays
                      }
                      onChange={e => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setCustomCustPeriodDays(val);
                        setCustPeriod(`${val}d`);
                      }}
                      style={{ backgroundColor: '#171725', borderColor: '#2e2e48', color: '#fff' }}
                      required 
                    />
                  </div>
                )}

                {(custPeriod.endsWith('m') || custPeriod === 'custom_months') && (
                  <div className="form-group animate-fade-in" style={{ transition: 'all 0.3s' }}>
                    <label className="form-label">عدد الأشهر المخصصة لدورة الدفع</label>
                    <input 
                      type="number" 
                      min={1}
                      className="form-input" 
                      value={
                        custPeriod.endsWith('m') 
                          ? parseInt(custPeriod.replace('m', '')) || customCustPeriodMonths 
                          : customCustPeriodMonths
                      }
                      onChange={e => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setCustomCustPeriodMonths(val);
                        setCustPeriod(`${val}m`);
                      }}
                      style={{ backgroundColor: '#171725', borderColor: '#2e2e48', color: '#fff' }}
                      required 
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">تاريخ انتهاء وفوترة الاشتراك</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={custExpiry}
                    onChange={e => setCustExpiry(e.target.value)}
                  />
                  <small style={{ color: '#8b8ba0', display: 'block', marginTop: '0.25rem' }}>اتركه فارغاً لترخيص الاشتراك مدى الحياة للمنشأة.</small>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>تمديد سريع مسبق الصلاحية</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        const start = custExpiry ? new Date(custExpiry) : new Date();
                        const base = isNaN(start.getTime()) ? new Date() : start;
                        base.setDate(base.getDate() + 30);
                        setCustExpiry(base.toISOString().split('T')[0]);
                      }}
                      style={{ fontSize: '0.8rem', padding: '0.45rem', flex: 1 }}
                    >
                      +30 يوم
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        const start = custExpiry ? new Date(custExpiry) : new Date();
                        const base = isNaN(start.getTime()) ? new Date() : start;
                        base.setDate(base.getDate() + 90);
                        setCustExpiry(base.toISOString().split('T')[0]);
                      }}
                      style={{ fontSize: '0.8rem', padding: '0.45rem', flex: 1 }}
                    >
                      +90 يوم
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        const start = custExpiry ? new Date(custExpiry) : new Date();
                        const base = isNaN(start.getTime()) ? new Date() : start;
                        base.setDate(base.getDate() + 365);
                        setCustExpiry(base.toISOString().split('T')[0]);
                      }}
                      style={{ fontSize: '0.8rem', padding: '0.45rem', flex: 1 }}
                    >
                      +سنة كاملة
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setCustExpiry('')}
                      style={{ fontSize: '0.8rem', padding: '0.45rem', flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                    >
                      مدى الحياة
                    </button>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCustModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '130px' }}>حفظ التراخيص</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: ADD/EDIT PLATFORM SUBSCRIPTION PLAN MODAL --- */}
      {showPlanModal && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal" style={{ maxWidth: '480px', border: '1px solid var(--border-color)', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={20} style={{ color: '#6366f1' }} />
                <h3 style={{ margin: 0, fontWeight: 800, color: '#fff' }}>{isPlanEditMode ? 'تعديل باقة منصة الساس' : 'إدراج باقة اشتراك جديدة للمنصة'}</h3>
              </div>
              <button onClick={() => setShowPlanModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSavePlatformPlan}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">اسم باقة المنصة</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="مثال: الباقة الفضية (Silver)" 
                    value={planName}
                    onChange={e => setPlanName(e.target.value)}
                    required 
                  />
                </div>

                <div className="grid grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">سعر الباقة</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={planPrice}
                      onChange={e => setPlanPrice(parseFloat(e.target.value))}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">عملة الباقة</label>
                    <select 
                      className="form-select"
                      value={planCurrency}
                      onChange={e => setPlanCurrency(e.target.value)}
                    >
                      <option value="JOD">JOD (دينار أردني)</option>
                      <option value="SAR">SAR (ريال سعودي)</option>
                      <option value="AED">AED (درهم إماراتي)</option>
                      <option value="USD">USD (دولار أمريكي)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">دورة الفوترة</label>
                    <select 
                      className="form-select"
                      value={
                        planPeriod === 'monthly' || planPeriod === 'yearly'
                          ? planPeriod
                          : planPeriod.endsWith('d')
                          ? 'custom_days'
                          : planPeriod.endsWith('m')
                          ? 'custom_months'
                          : 'monthly'
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'monthly' || val === 'yearly') {
                          setPlanPeriod(val);
                        } else if (val === 'custom_days') {
                          setPlanPeriod(`${customPlanPeriodDays}d`);
                        } else if (val === 'custom_months') {
                          setPlanPeriod(`${customPlanPeriodMonths}m`);
                        }
                      }}
                    >
                      <option value="monthly">شهري</option>
                      <option value="yearly">سنوي</option>
                      <option value="custom_days">عدد أيام مخصص</option>
                      <option value="custom_months">عدد أشهر مخصص</option>
                    </select>
                  </div>

                  {(planPeriod.endsWith('d') || planPeriod === 'custom_days') && (
                    <div className="form-group animate-fade-in" style={{ transition: 'all 0.3s' }}>
                      <label className="form-label">عدد الأيام المخصصة</label>
                      <input 
                        type="number" 
                        min={1}
                        className="form-input" 
                        value={
                          planPeriod.endsWith('d') 
                            ? parseInt(planPeriod.replace('d', '')) || customPlanPeriodDays 
                            : customPlanPeriodDays
                        }
                        onChange={e => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setCustomPlanPeriodDays(val);
                          setPlanPeriod(`${val}d`);
                        }}
                        style={{ backgroundColor: '#171725', borderColor: '#2e2e48', color: '#fff' }}
                        required 
                      />
                    </div>
                  )}

                  {(planPeriod.endsWith('m') || planPeriod === 'custom_months') && (
                    <div className="form-group animate-fade-in" style={{ transition: 'all 0.3s' }}>
                      <label className="form-label">عدد الأشهر المخصصة</label>
                      <input 
                        type="number" 
                        min={1}
                        className="form-input" 
                        value={
                          planPeriod.endsWith('m') 
                            ? parseInt(planPeriod.replace('m', '')) || customPlanPeriodMonths 
                            : customPlanPeriodMonths
                        }
                        onChange={e => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setCustomPlanPeriodMonths(val);
                          setPlanPeriod(`${val}m`);
                        }}
                        style={{ backgroundColor: '#171725', borderColor: '#2e2e48', color: '#fff' }}
                        required 
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">مميزات باقة الساس (مفصولة بفاصلة `,`)</label>
                  <textarea 
                    className="form-textarea" 
                    rows={3}
                    placeholder="إدارة مشتركين غير محدودة, نظام باركود متقدم, دعم 24/7"
                    value={planFeatures}
                    onChange={e => setPlanFeatures(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '130px' }}>حفظ الباقة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Technical support Ticket Response Modal --- */}
      {showTicketModal && (
        <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="modal" style={{ maxWidth: '520px', border: '1px solid var(--border-color)', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} style={{ color: '#6366f1' }} />
                <h3 style={{ margin: 0, fontWeight: 800, color: '#fff' }}>رد وإغلاق تذكرة الدعم الفني</h3>
              </div>
              <button onClick={() => setShowTicketModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReplyTicket}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#171725', borderRadius: '8px', border: '1px solid #232338' }}>
                  <span style={{ fontSize: '0.8rem', color: '#8b8ba0' }}>صاحب التذكرة: {selectedTicket?.tenantName}</span>
                  <h4 style={{ fontWeight: 'bold', color: '#fff', marginTop: '0.25rem' }}>{selectedTicket?.subject}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{selectedTicket?.description}</p>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">الرد الرسمي للمسؤول وحل المشكلة</label>
                  <textarea 
                    className="form-textarea" 
                    rows={4}
                    placeholder="اكتب توجيه الحل الفني للمشترك لتأكيد حل مشكلته وإغلاق تذكرته فوراً..."
                    value={ticketReplyText}
                    onChange={e => setTicketReplyText(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTicketModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>اعتماد الحل وإغلاق التذكرة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: Add problem/solution log modal --- */}
      {showLogModal && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal" style={{ maxWidth: '480px', border: '1px solid var(--border-color)', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: '#6366f1' }} />
                <h3 style={{ margin: 0, fontWeight: 800, color: '#fff' }}>إضافة سجل فني لقاعدة الحلول والمشاكل</h3>
              </div>
              <button onClick={() => setShowLogModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveSupportLog}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">تصنيف السجل الفني</label>
                  <select 
                    className="form-select"
                    value={newLogType}
                    onChange={e => setNewLogType(e.target.value as 'problem' | 'solution')}
                  >
                    <option value="problem">رصد مشكلة عامة للمنصة (Problem Log)</option>
                    <option value="solution">توثيق حل معتمد ومعالجة برمجية (Solution Log)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">عنوان السجل الفني</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="مثال: تعليق استجابة خادم استعلامات الحضور المباشر"
                    value={newLogTitle}
                    onChange={e => setNewLogTitle(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">التفاصيل الفنية والخطوات المتبعة</label>
                  <textarea 
                    className="form-textarea" 
                    rows={4}
                    placeholder="اكتب المشكلة أو حلها الفني والخطوات اللازمة بالتفصيل..."
                    value={newLogContent}
                    onChange={e => setNewLogContent(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLogModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '130px' }}>حفظ السجل الفني</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
