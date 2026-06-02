'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/lib/context';
import {
  getCustomers,
  getAttendanceLogs,
  saveAttendanceLog,
  getAccessCards,
  saveAccessCard,
  deleteAccessCard,
  getActiveSessions,
  pushNotification,
  type AttendanceLog,
  type AccessCard,
} from '@/lib/store';
import { getRemainingDays, getSubscriptionStatus, generateId } from '@/lib/utils';
import {
  Search, CreditCard, BarChart3, Clock, Users, Shield, ShieldCheck, ShieldX,
  LogIn, LogOut, Ban, Wifi, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Filter, Download, Plus, Trash2, Edit3, Activity, TrendingUp, DoorOpen,
  DoorClosed, Zap, Eye, Hash, Tag, ChevronDown, X, ToggleLeft, ToggleRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'control' | 'dashboard' | 'logs' | 'cards' | 'activity';

type ScanResult = {
  success: boolean;
  entryType?: 'entry' | 'exit';
  customer?: any;
  reason?: string;
  remaining?: number;
  log?: AttendanceLog;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDuration = (ms: number): string => {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const GATES = ['Main Entrance', 'Secondary Gate', 'VIP Gate'];

const CARD_TYPE_LABELS: Record<string, string> = {
  rfid: 'RFID',
  nfc: 'NFC',
  qr: 'QR Code',
  barcode: 'Barcode',
};

const CARD_STATUS_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  active:    { label: 'نشطة',     badge: 'badge-success', color: 'var(--success)' },
  disabled:  { label: 'معطلة',    badge: 'badge-warning', color: 'var(--warning)' },
  lost:      { label: 'مفقودة',   badge: 'badge-danger',  color: 'var(--danger)'  },
  expired:   { label: 'منتهية',   badge: 'badge-warning', color: 'var(--warning)' },
  suspended: { label: 'موقوفة',   badge: 'badge-danger',  color: 'var(--danger)'  },
};

const RESULT_LABELS: Record<string, { ar: string; en: string; icon: string; color: string }> = {
  granted: { ar: 'دخول مقبول', en: 'Access Granted', icon: '✓', color: 'var(--success)' },
  denied:  { ar: 'دخول مرفوض', en: 'Access Denied',  icon: '✕', color: 'var(--danger)'  },
};

const REASON_LABELS: Record<string, { ar: string; en: string }> = {
  expired:      { ar: 'الاشتراك منتهي',       en: 'Subscription Expired'   },
  frozen:       { ar: 'الاشتراك مجمد',        en: 'Membership Frozen'      },
  disabled_card:{ ar: 'البطاقة معطلة',        en: 'Card Disabled'          },
  lost_card:    { ar: 'البطاقة مبلغ عن فقدانها', en: 'Card Reported Lost'  },
  unknown_card: { ar: 'بطاقة غير معرّفة',     en: 'Unknown Card'           },
  duplicate:    { ar: 'دخول مكرر',            en: 'Duplicate Entry'        },
  no_card:      { ar: 'لا توجد بطاقة',        en: 'No Card Assigned'       },
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { settings, t, refreshData } = useApp();
  const isAr = settings.language === 'ar';

  // ── State ──
  const [activeTab, setActiveTab] = useState<Tab>('control');
  const [customers, setCustomers] = useState<any[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [cards, setCards] = useState<AccessCard[]>([]);
  const [activeSessions, setActiveSessions] = useState<{ customerId: string; entryLog: AttendanceLog }[]>([]);

  // Control Panel
  const [cardInput, setCardInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState('Main Entrance');
  const [readerActive, setReaderActive] = useState(true);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const gateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Logs filters
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');

  // Cards modal
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Partial<AccessCard> | null>(null);

  // Activity tab
  const [activitySearch, setActivitySearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // ── Load Data ──
  const loadData = useCallback(() => {
    setCustomers(getCustomers());
    setLogs(getAttendanceLogs());
    setCards(getAccessCards());
    setActiveSessions(getActiveSessions());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-focus card reader input
  useEffect(() => {
    if (activeTab === 'control' && readerActive) {
      cardInputRef.current?.focus();
    }
  }, [activeTab, readerActive]);

  // ── Search ──
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      customers.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.id?.toLowerCase().includes(q)
      ).slice(0, 6)
    );
  }, [searchQuery, customers]);

  // ── Gate animation ──
  const triggerGate = (open: boolean) => {
    setGateOpen(open);
    if (gateTimerRef.current) clearTimeout(gateTimerRef.current);
    if (open) {
      gateTimerRef.current = setTimeout(() => setGateOpen(false), 4000);
    }
  };

  // ── Core Access Logic ──
  const processAccess = useCallback((customer: any, cardUid?: string) => {
    const isFrozen = customer.notes?.includes('[FREEZE]');
    const subStatus = getSubscriptionStatus(customer.endDate);
    const remaining = getRemainingDays(customer.endDate);

    // Check card status if UID provided
    if (cardUid) {
      const card = cards.find(c => c.uid.toLowerCase() === cardUid.toLowerCase());
      if (card) {
        if (card.status === 'disabled') {
          const result: ScanResult = { success: false, reason: 'disabled_card', customer };
          setScanResult(result);
          logAccess(customer, 'entry', 'denied', 'disabled_card', cardUid);
          triggerGate(false);
          return;
        }
        if (card.status === 'lost') {
          const result: ScanResult = { success: false, reason: 'lost_card', customer };
          setScanResult(result);
          logAccess(customer, 'entry', 'denied', 'lost_card', cardUid);
          triggerGate(false);
          pushNotification({ type: 'expired', title: '⚠️ بطاقة مفقودة', message: `${customer.name} — محاولة دخول ببطاقة مبلغ عن فقدانها`, customerId: customer.id });
          return;
        }
        if (card.status === 'suspended' || card.status === 'expired') {
          const result: ScanResult = { success: false, reason: 'disabled_card', customer };
          setScanResult(result);
          logAccess(customer, 'entry', 'denied', 'disabled_card', cardUid);
          triggerGate(false);
          return;
        }
      }
    }

    if (isFrozen) {
      setScanResult({ success: false, reason: 'frozen', customer });
      logAccess(customer, 'entry', 'denied', 'frozen', cardUid);
      triggerGate(false);
      return;
    }

    if (subStatus === 'expired') {
      setScanResult({ success: false, reason: 'expired', customer, remaining });
      logAccess(customer, 'entry', 'denied', 'expired', cardUid);
      triggerGate(false);
      pushNotification({
        type: 'expired',
        title: t('محاولة دخول — اشتراك منتهي', 'Access Attempt — Subscription Expired'),
        message: `${customer.name} — ${t('حاول الدخول لكن اشتراكه منتهٍ', 'attempted access with expired subscription')}`,
        customerId: customer.id,
      });
      return;
    }

    // Determine entry or exit
    const lastGranted = [...logs]
      .filter(l => l.customerId === customer.id && l.result === 'granted')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const entryType: 'entry' | 'exit' = (lastGranted?.entryType === 'entry') ? 'exit' : 'entry';

    const sessionId = entryType === 'entry'
      ? `SES-${generateId()}`
      : lastGranted?.sessionId;

    const log = logAccess(customer, entryType, 'granted', undefined, cardUid, sessionId);
    setScanResult({ success: true, entryType, customer, remaining, log });
    triggerGate(true);
    refreshData();
    loadData();
  }, [cards, logs, selectedGate, t, refreshData, loadData]);

  const logAccess = (
    customer: any,
    entryType: 'entry' | 'exit',
    result: 'granted' | 'denied',
    reason?: AttendanceLog['reason'],
    cardUid?: string,
    sessionId?: string,
  ): AttendanceLog => {
    const log: AttendanceLog = {
      id: `LOG-${generateId()}`,
      customerId: customer.id,
      customerName: customer.name,
      cardUid,
      entryType,
      result,
      reason,
      gate: selectedGate,
      timestamp: new Date().toISOString(),
      sessionId,
      date: new Date().toISOString().split('T')[0],
    };
    saveAttendanceLog(log);
    setLogs(prev => [log, ...prev]);
    return log;
  };

  // Handle card reader input (USB HID keyboard wedge)
  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && cardInput.trim()) {
      const uid = cardInput.trim();
      setCardInput('');
      // Find card
      const card = cards.find(c => c.uid.toLowerCase() === uid.toLowerCase());
      if (!card) {
        // Unknown card
        setScanResult({ success: false, reason: 'unknown_card' });
        const unknownLog: AttendanceLog = {
          id: `LOG-${generateId()}`,
          customerId: 'UNKNOWN',
          customerName: 'Unknown',
          cardUid: uid,
          entryType: 'entry',
          result: 'denied',
          reason: 'unknown_card',
          gate: selectedGate,
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
        };
        saveAttendanceLog(unknownLog);
        setLogs(prev => [unknownLog, ...prev]);
        triggerGate(false);
        return;
      }
      const customer = customers.find(c => c.id === card.customerId);
      if (!customer) return;
      processAccess(customer, uid);
    }
  };

  const handleManualSelect = (customer: any) => {
    setSearchQuery('');
    setSearchResults([]);
    processAccess(customer);
  };

  const simulateScan = () => {
    const activeCustomers = customers.filter(c => getSubscriptionStatus(c.endDate) === 'active');
    if (activeCustomers.length === 0) {
      alert(t('لا يوجد مشتركون نشطون للمحاكاة', 'No active members to simulate'));
      return;
    }
    const random = activeCustomers[Math.floor(Math.random() * activeCustomers.length)];
    processAccess(random);
  };

  // ── Filtered Logs ──
  const filteredLogs = logs.filter(log => {
    if (filterDate && log.date !== filterDate) return false;
    if (filterType !== 'all' && log.entryType !== filterType) return false;
    if (filterResult !== 'all' && log.result !== filterResult) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!log.customerName?.toLowerCase().includes(q) && !log.cardUid?.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // ── Stats ──
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.date === todayStr);
  const todayGranted = todayLogs.filter(l => l.result === 'granted');
  const todayDenied = todayLogs.filter(l => l.result === 'denied');
  const todayEntries = todayGranted.filter(l => l.entryType === 'entry').length;
  const todayExits = todayGranted.filter(l => l.entryType === 'exit').length;
  const currentlyInside = activeSessions.length;

  // Month stats
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthLogs = logs.filter(l => l.date?.startsWith(thisMonth) && l.result === 'granted' && l.entryType === 'entry');
  const memberVisits: Record<string, { name: string; count: number }> = {};
  for (const log of monthLogs) {
    if (!memberVisits[log.customerId]) {
      memberVisits[log.customerId] = { name: log.customerName || log.customerId, count: 0 };
    }
    memberVisits[log.customerId].count++;
  }
  const sortedVisits = Object.entries(memberVisits).sort((a, b) => b[1].count - a[1].count);

  // ── Member Activity ──
  const activityResults = activitySearch.trim()
    ? customers.filter(c =>
        c.name?.toLowerCase().includes(activitySearch.toLowerCase()) ||
        c.phone?.includes(activitySearch)
      ).slice(0, 8)
    : [];

  const getMemberStats = (customerId: string) => {
    const memberLogs = logs.filter(l => l.customerId === customerId);
    const entries = memberLogs.filter(l => l.result === 'granted' && l.entryType === 'entry');
    const denied = memberLogs.filter(l => l.result === 'denied');
    const monthEntries = entries.filter(l => l.date?.startsWith(thisMonth));
    const lastEntry = entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    // Calculate avg session duration
    const exits = memberLogs.filter(l => l.result === 'granted' && l.entryType === 'exit' && l.sessionId);
    let totalDuration = 0;
    let sessionsWithDuration = 0;
    for (const exit of exits) {
      const entry = entries.find(e => e.sessionId === exit.sessionId);
      if (entry) {
        totalDuration += new Date(exit.timestamp).getTime() - new Date(entry.timestamp).getTime();
        sessionsWithDuration++;
      }
    }
    const avgDuration = sessionsWithDuration > 0 ? totalDuration / sessionsWithDuration : 0;

    return {
      totalEntries: entries.length,
      deniedCount: denied.length,
      monthEntries: monthEntries.length,
      lastEntry,
      avgDuration,
    };
  };

  // ── Export CSV ──
  const exportCSV = () => {
    const rows = [
      ['ID', 'Customer', 'Card UID', 'Type', 'Result', 'Reason', 'Gate', 'Timestamp'],
      ...filteredLogs.map(l => [
        l.id, l.customerName || '', l.cardUid || '', l.entryType,
        l.result, l.reason || '', l.gate, l.timestamp,
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access_logs_${todayStr}.csv`;
    a.click();
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <style jsx global>{`
        @keyframes gatePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes scannerLaser {
          0% { top: 4%; }
          50% { top: 92%; }
          100% { top: 4%; }
        }
        @keyframes resultPop {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes deniedShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes grantedGlow {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          70% { box-shadow: 0 0 0 20px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        .result-pop { animation: resultPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
        .denied-shake { animation: deniedShake 0.5s ease; }
        .granted-glow { animation: grantedGlow 1s ease-out; }
        .gate-indicator {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab-active {
          background: var(--primary-light) !important;
          color: var(--primary) !important;
          border-color: var(--primary) !important;
        }
        .log-row-granted { border-left: 3px solid var(--success); }
        .log-row-denied { border-left: 3px solid var(--danger); }
        body[dir="rtl"] .log-row-granted { border-left: none; border-right: 3px solid var(--success); }
        body[dir="rtl"] .log-row-denied { border-left: none; border-right: 3px solid var(--danger); }
        .stat-pulse {
          animation: statPulse 2s infinite;
        }
        @keyframes statPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .inside-row:hover { background: rgba(99,102,241,0.05) !important; }
      `}</style>

      <div className="page-container animate-fade-in" style={{ maxWidth: '1400px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={20} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('مركز التحكم بالدخول والخروج', 'Access Control Center')}
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {t('إدارة احترافية للدخول والخروج — RFID / NFC / QR / Barcode', 'Professional entry & exit management — RFID / NFC / QR / Barcode')}
            </p>
          </div>

          {/* Live stats bar */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: t('داخل الجيم', 'Inside Now'), value: currentlyInside, color: 'var(--primary)', icon: <Users size={14}/> },
              { label: t('دخلوا اليوم', 'Entries Today'), value: todayEntries, color: 'var(--success)', icon: <LogIn size={14}/> },
              { label: t('مرفوض', 'Denied'), value: todayDenied.length, color: 'var(--danger)', icon: <ShieldX size={14}/> },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: stat.color }}>{stat.icon}</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: stat.color }}>{stat.value}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
          {([
            { id: 'control',   icon: <ShieldCheck size={16}/>, ar: 'لوحة التحكم',      en: 'Access Control' },
            { id: 'dashboard', icon: <BarChart3 size={16}/>,   ar: 'لوحة الإحصائيات', en: 'Dashboard'      },
            { id: 'logs',      icon: <Clock size={16}/>,       ar: 'سجل الأحداث',      en: 'Access Logs'    },
            { id: 'cards',     icon: <CreditCard size={16}/>,  ar: 'إدارة البطاقات',   en: 'Cards'          },
            { id: 'activity',  icon: <Activity size={16}/>,    ar: 'نشاط المشترك',     en: 'Member Activity'},
          ] as { id: Tab; icon: React.ReactNode; ar: string; en: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'tab-active' : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.6rem 1.1rem',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                border: '1px solid transparent',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '1px solid transparent',
                background: 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon}
              {isAr ? tab.ar : tab.en}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1 — ACCESS CONTROL PANEL
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'control' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* Left: Scanner + Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Card Reader */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Wifi size={18} style={{ color: readerActive ? 'var(--success)' : 'var(--text-muted)' }} />
                    {t('قارئ البطاقات (RFID/Barcode)', 'Card Reader (RFID/Barcode)')}
                  </h3>
                  <button
                    onClick={() => setReaderActive(r => !r)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: readerActive ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    {readerActive ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                    {readerActive ? t('نشط', 'Active') : t('متوقف', 'Paused')}
                  </button>
                </div>

                {/* Scanner visual */}
                <div
                  onClick={() => cardInputRef.current?.focus()}
                  style={{
                    width: '100%',
                    height: '180px',
                    background: '#050510',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${readerActive ? 'var(--primary)' : 'var(--border-color)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                    boxShadow: readerActive ? '0 0 20px rgba(99,102,241,0.2)' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {readerActive && (
                    <div style={{
                      position: 'absolute', left: '5%', right: '5%', height: '2px',
                      background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
                      boxShadow: '0 0 12px var(--primary)',
                      animation: 'scannerLaser 2s linear infinite',
                    }} />
                  )}
                  <CreditCard size={40} style={{ color: readerActive ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '0.75rem' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '0 1rem' }}>
                    {readerActive
                      ? t('🔴 قارئ البطاقة نشط — مرر البطاقة أو امسح الكود', '🔴 Reader active — swipe card or scan code')
                      : t('قارئ متوقف', 'Reader paused')}
                  </p>
                  {/* Hidden HID input */}
                  <input
                    ref={cardInputRef}
                    value={cardInput}
                    onChange={e => setCardInput(e.target.value)}
                    onKeyDown={handleCardKeyDown}
                    disabled={!readerActive}
                    style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
                    aria-label="Card UID Input"
                  />
                </div>

                {/* Gate selector */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {t('البوابة:', 'Gate:')}
                  </span>
                  <select
                    value={selectedGate}
                    onChange={e => setSelectedGate(e.target.value)}
                    className="form-select"
                    style={{ flex: 1, padding: '0.4rem 0.7rem', fontSize: '0.85rem' }}
                  >
                    {GATES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                {/* Simulate button */}
                <button className="btn btn-primary" style={{ width: '100%', gap: '0.5rem' }} onClick={simulateScan}>
                  <Zap size={15} /> {t('محاكاة مسح بطاقة عشوائية', 'Simulate Random Card Scan')}
                </button>
              </div>

              {/* Manual Search */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Search size={16} style={{ color: 'var(--primary)' }} />
                  {t('البحث اليدوي عن مشترك', 'Manual Member Search')}
                </h3>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'right' : 'left']: '0.85rem', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingInlineStart: '2.5rem' }}
                    placeholder={t('الاسم أو رقم الهاتف...', 'Name or phone number...')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div style={{ marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {searchResults.map(cust => {
                      const status = getSubscriptionStatus(cust.endDate);
                      const isInside = activeSessions.some(s => s.customerId === cust.id);
                      return (
                        <div
                          key={cust.id}
                          onClick={() => handleManualSelect(cust)}
                          style={{
                            padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex',
                            justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: '1px solid var(--border-color)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cust.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cust.phone}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            {isInside && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{t('داخل', 'Inside')}</span>}
                            <span className={`badge ${status === 'active' ? 'badge-success' : status === 'expiring' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                              {status === 'active' ? t('نشط', 'Active') : status === 'expiring' ? t('ينتهي قريباً', 'Expiring') : t('منتهي', 'Expired')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Result + Gate Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Gate Status */}
              <div className="card gate-indicator" style={{
                padding: '1rem 1.5rem',
                borderColor: gateOpen ? 'var(--success)' : 'var(--border-color)',
                background: gateOpen ? 'rgba(16,185,129,0.06)' : 'var(--bg-secondary)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {gateOpen
                      ? <DoorOpen size={28} style={{ color: 'var(--success)', animation: 'gatePulse 1s infinite' }} />
                      : <DoorClosed size={28} style={{ color: 'var(--text-muted)' }} />
                    }
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: gateOpen ? 'var(--success)' : 'var(--text-secondary)' }}>
                        {gateOpen ? t('البوابة مفتوحة', 'Gate Open') : t('البوابة مغلقة', 'Gate Closed')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedGate}</div>
                    </div>
                  </div>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: gateOpen ? 'var(--success)' : 'var(--text-muted)',
                    boxShadow: gateOpen ? '0 0 8px var(--success)' : 'none',
                    animation: gateOpen ? 'gatePulse 1s infinite' : 'none',
                  }} />
                </div>
              </div>

              {/* Scan Result */}
              <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '360px' }}>
                {scanResult ? (
                  <div
                    className={`result-pop ${scanResult.success ? 'granted-glow' : 'denied-shake'}`}
                    style={{ textAlign: 'center', padding: '1.5rem', width: '100%' }}
                  >
                    {/* Big Icon */}
                    <div style={{
                      width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.25rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
                      background: scanResult.success ? 'var(--success-light)' : 'var(--danger-light)',
                      color: scanResult.success ? 'var(--success)' : 'var(--danger)',
                      border: `2px solid ${scanResult.success ? 'var(--success)' : 'var(--danger)'}`,
                    }}>
                      {scanResult.success
                        ? (scanResult.entryType === 'exit' ? <LogOut size={36}/> : <LogIn size={36}/>)
                        : <ShieldX size={36}/>
                      }
                    </div>

                    {/* Result Title */}
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.3rem', color: scanResult.success ? 'var(--success)' : 'var(--danger)' }}>
                      {scanResult.success
                        ? (scanResult.entryType === 'exit' ? t('تسجيل خروج ✓', 'Exit Logged ✓') : t('دخول مقبول ✓', 'Access Granted ✓'))
                        : t('دخول مرفوض ✕', 'Access Denied ✕')
                      }
                    </div>

                    {/* Reason */}
                    {!scanResult.success && scanResult.reason && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--danger)', marginBottom: '1rem', fontWeight: 600 }}>
                        {isAr ? REASON_LABELS[scanResult.reason]?.ar : REASON_LABELS[scanResult.reason]?.en}
                      </div>
                    )}

                    {/* Customer Card */}
                    {scanResult.customer && (
                      <div style={{
                        background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'start', margin: '0 auto', maxWidth: '340px',
                      }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: '50%', fontSize: '1.4rem',
                            background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {scanResult.customer.gender === 'female' ? '👩' : '👨'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{scanResult.customer.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{scanResult.customer.phone}</div>
                          </div>
                          {activeSessions.some(s => s.customerId === scanResult.customer?.id) && (
                            <span className="badge badge-success" style={{ fontSize: '0.65rem', marginInlineStart: 'auto' }}>
                              {t('داخل الجيم', 'Inside')}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>{t('البوابة: ', 'Gate: ')}</span>
                            <strong>{selectedGate}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>{t('الوقت: ', 'Time: ')}</span>
                            <strong>{new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</strong>
                          </div>
                          {scanResult.success && scanResult.remaining !== undefined && (
                            <div style={{ gridColumn: '1 / -1', marginTop: '0.25rem', padding: '0.4rem 0.6rem', background: 'var(--success-light)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontWeight: 600, textAlign: 'center' }}>
                              {t(`متبقي: ${scanResult.remaining} يوم`, `Days remaining: ${scanResult.remaining}`)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Unknown card */}
                    {!scanResult.customer && scanResult.reason === 'unknown_card' && (
                      <div style={{ padding: '1rem', background: 'var(--warning-light)', borderRadius: 'var(--radius-md)', color: 'var(--warning)', fontWeight: 600, fontSize: '0.9rem' }}>
                        ⚠️ {t('بطاقة غير معرّفة في النظام', 'Unknown card — not registered in system')}
                      </div>
                    )}

                    <button
                      onClick={() => setScanResult(null)}
                      style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', margin: '1rem auto 0' }}
                    >
                      <X size={14}/> {t('إغلاق', 'Clear')}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    <Shield size={56} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 500 }}>
                      {t('في انتظار مسح بطاقة أو البحث اليدوي...', 'Awaiting card scan or manual search...')}
                    </p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>
                      {t('مرّر بطاقة RFID أو ابحث عن مشترك أعلاه', 'Swipe RFID card or search for a member above')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2 — DASHBOARD
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Today Stats */}
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('إحصائيات اليوم', "Today's Stats")}
              </h3>
              <div className="grid grid-4" style={{ gap: '1rem' }}>
                {[
                  { label: t('داخل الجيم الآن', 'Currently Inside'), value: currentlyInside, color: 'var(--primary)', bg: 'var(--primary-light)', icon: <Users size={22}/> },
                  { label: t('دخلوا اليوم', 'Entries Today'), value: todayEntries, color: 'var(--success)', bg: 'var(--success-light)', icon: <LogIn size={22}/> },
                  { label: t('خرجوا اليوم', 'Exits Today'), value: todayExits, color: 'var(--info)', bg: 'var(--info-light)', icon: <LogOut size={22}/> },
                  { label: t('محاولات مرفوضة', 'Denied Today'), value: todayDenied.length, color: 'var(--danger)', bg: 'var(--danger-light)', icon: <Ban size={22}/> },
                ].map(stat => (
                  <div key={stat.label} className="stat-card" style={{ background: stat.bg, borderColor: stat.color + '40' }}>
                    <div className="stat-card-info">
                      <div className="stat-card-value" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="stat-card-label">{stat.label}</div>
                    </div>
                    <div className="stat-card-icon" style={{ background: 'rgba(255,255,255,0.1)', color: stat.color }}>
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-2" style={{ gap: '1.5rem' }}>

              {/* Currently Inside */}
              <div className="card">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'gatePulse 1.5s infinite' }} />
                  {t('الموجودون داخل الجيم الآن', 'Currently Inside Gym')}
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{currentlyInside}</span>
                </h3>
                {activeSessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.85rem' }}>{t('لا أحد داخل الجيم حالياً', 'No one is inside the gym right now')}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {activeSessions.map(session => {
                      const cust = customers.find(c => c.id === session.customerId);
                      const duration = Date.now() - new Date(session.entryLog.timestamp).getTime();
                      return (
                        <div key={session.customerId} className="inside-row" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-tertiary)', cursor: 'default',
                          transition: 'background 0.15s',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>{cust?.gender === 'female' ? '👩' : '👨'}</span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cust?.name || session.customerId}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {t('دخل:', 'In:')} {formatTime(session.entryLog.timestamp)}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
                            {formatDuration(duration)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Members this Month */}
              <div className="card">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <TrendingUp size={16} style={{ color: 'var(--warning)' }} />
                  {t('أكثر الأعضاء حضوراً هذا الشهر', 'Top Members This Month')}
                </h3>
                {sortedVisits.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {t('لا توجد بيانات لهذا الشهر بعد', 'No data for this month yet')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {sortedVisits.slice(0, 10).map(([id, data], idx) => (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)' }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 800,
                          background: idx === 0 ? '#f59e0b' : idx === 1 ? '#9ca3af' : idx === 2 ? '#cd7c2e' : 'var(--bg-primary)',
                          color: idx < 3 ? '#000' : 'var(--text-muted)',
                        }}>{idx + 1}</span>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem' }}>{data.name}</span>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>
                          {data.count} {t('زيارة', 'visits')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent denied entries */}
            {todayDenied.length > 0 && (
              <div className="card" style={{ borderColor: 'var(--danger)', background: 'rgba(239,68,68,0.03)' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--danger)' }}>
                  <AlertTriangle size={16}/> {t('محاولات الدخول المرفوضة اليوم', "Today's Denied Access Attempts")}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {todayDenied.slice(0, 5).map(log => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>{log.customerName}</div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{log.reason && (isAr ? REASON_LABELS[log.reason]?.ar : REASON_LABELS[log.reason]?.en)}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatTime(log.timestamp)}</span>
                        <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{log.gate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3 — ACCESS LOGS
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'logs' && (
          <div>
            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                <div>
                  <label className="form-label">{t('التاريخ', 'Date')}</label>
                  <input type="date" className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">{t('النوع', 'Type')}</label>
                  <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="all">{t('الكل', 'All')}</option>
                    <option value="entry">{t('دخول', 'Entry')}</option>
                    <option value="exit">{t('خروج', 'Exit')}</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('النتيجة', 'Result')}</label>
                  <select className="form-select" value={filterResult} onChange={e => setFilterResult(e.target.value)}>
                    <option value="all">{t('الكل', 'All')}</option>
                    <option value="granted">{t('مقبول', 'Granted')}</option>
                    <option value="denied">{t('مرفوض', 'Denied')}</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('بحث', 'Search')}</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'right' : 'left']: '0.75rem', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingInlineStart: '2.2rem' }}
                      placeholder={t('اسم أو كود...', 'Name or UID...')}
                      value={filterSearch}
                      onChange={e => setFilterSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setFilterDate(''); setFilterType('all'); setFilterResult('all'); setFilterSearch(''); }}
                    style={{ flex: 1 }}
                  >
                    <RefreshCw size={13}/> {t('إعادة تعيين', 'Reset')}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={exportCSV} style={{ flex: 1 }}>
                    <Download size={13}/> CSV
                  </button>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t(`عرض ${filteredLogs.length} سجل`, `Showing ${filteredLogs.length} records`)}
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('الوقت', 'Time')}</th>
                    <th>{t('المشترك', 'Member')}</th>
                    <th>{t('كود البطاقة', 'Card UID')}</th>
                    <th>{t('النوع', 'Type')}</th>
                    <th>{t('النتيجة', 'Result')}</th>
                    <th>{t('السبب', 'Reason')}</th>
                    <th>{t('البوابة', 'Gate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        {t('لا توجد سجلات تطابق الفلاتر المحددة', 'No records match the selected filters')}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.slice(0, 200).map(log => (
                      <tr key={log.id} className={log.result === 'granted' ? 'log-row-granted' : 'log-row-denied'}>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600 }}>{formatTime(log.timestamp)}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{log.date}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{log.customerName || '—'}</td>
                        <td>
                          {log.cardUid ? (
                            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              {log.cardUid}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {log.entryType === 'entry'
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)', fontWeight: 600 }}><LogIn size={14}/>{t('دخول', 'Entry')}</span>
                            : <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--info)', fontWeight: 600 }}><LogOut size={14}/>{t('خروج', 'Exit')}</span>
                          }
                        </td>
                        <td>
                          {log.result === 'granted'
                            ? <span className="badge badge-success">{t('مقبول', 'Granted')}</span>
                            : <span className="badge badge-danger">{t('مرفوض', 'Denied')}</span>
                          }
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {log.reason ? (isAr ? REASON_LABELS[log.reason]?.ar : REASON_LABELS[log.reason]?.en) : '—'}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{log.gate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 4 — CARDS MANAGEMENT
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'cards' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{t('إدارة بطاقات الدخول', 'Access Cards Management')}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('RFID / NFC / QR / Barcode', 'RFID / NFC / QR / Barcode')}</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => { setEditingCard({ type: 'rfid', status: 'active', activatedAt: new Date().toISOString() }); setShowCardModal(true); }}
              >
                <Plus size={15}/> {t('إضافة بطاقة', 'Add Card')}
              </button>
            </div>

            {/* Summary badges */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {(['active', 'disabled', 'lost', 'expired', 'suspended'] as const).map(status => {
                const count = cards.filter(c => c.status === status).length;
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: CARD_STATUS_CONFIG[status].color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{CARD_STATUS_CONFIG[status].label}</span>
                    <span style={{ fontWeight: 700, color: CARD_STATUS_CONFIG[status].color }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {cards.length === 0 ? (
              <div className="empty-state">
                <CreditCard size={48} className="empty-state-icon" />
                <div className="empty-state-text">{t('لا توجد بطاقات مسجلة بعد', 'No access cards registered yet')}</div>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditingCard({ type: 'rfid', status: 'active', activatedAt: new Date().toISOString() }); setShowCardModal(true); }}>
                  <Plus size={14}/> {t('إضافة أول بطاقة', 'Add First Card')}
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('كود البطاقة (UID)', 'Card UID')}</th>
                      <th>{t('النوع', 'Type')}</th>
                      <th>{t('الحالة', 'Status')}</th>
                      <th>{t('صاحب البطاقة', 'Assigned To')}</th>
                      <th>{t('تاريخ التفعيل', 'Activated')}</th>
                      <th>{t('الإجراءات', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map(card => {
                      const owner = customers.find(c => c.id === card.customerId);
                      const cfg = CARD_STATUS_CONFIG[card.status];
                      return (
                        <tr key={card.id}>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                              {card.uid}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                              {CARD_TYPE_LABELS[card.type]}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                          </td>
                          <td>
                            {owner ? (
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{owner.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{owner.phone}</div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(card.activatedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                title={t('تعديل', 'Edit')}
                                onClick={() => { setEditingCard({ ...card }); setShowCardModal(true); }}
                              >
                                <Edit3 size={13}/>
                              </button>
                              {card.status !== 'active' && (
                                <button
                                  className="btn btn-success btn-sm"
                                  title={t('تفعيل', 'Activate')}
                                  onClick={() => { saveAccessCard({ ...card, status: 'active', deactivatedAt: undefined }); loadData(); }}
                                >
                                  <CheckCircle size={13}/>
                                </button>
                              )}
                              {card.status === 'active' && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  title={t('تعطيل', 'Disable')}
                                  onClick={() => { saveAccessCard({ ...card, status: 'disabled', deactivatedAt: new Date().toISOString() }); loadData(); }}
                                >
                                  <XCircle size={13}/>
                                </button>
                              )}
                              <button
                                className="btn btn-danger btn-sm"
                                title={t('حذف', 'Delete')}
                                onClick={() => { if (confirm(t('هل تريد حذف هذه البطاقة؟', 'Delete this card?'))) { deleteAccessCard(card.id); loadData(); } }}
                              >
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Card Modal */}
            {showCardModal && editingCard && (
              <div className="modal-overlay" onClick={() => setShowCardModal(false)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 style={{ fontWeight: 700 }}>
                      {editingCard.id ? t('تعديل البطاقة', 'Edit Card') : t('إضافة بطاقة دخول', 'Add Access Card')}
                    </h3>
                    <button onClick={() => setShowCardModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <X size={20}/>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">{t('كود البطاقة (UID) *', 'Card UID *')}</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. RFID-78452199"
                        value={editingCard.uid || ''}
                        onChange={e => setEditingCard(c => ({ ...c!, uid: e.target.value }))}
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('نوع البطاقة', 'Card Type')}</label>
                      <select
                        className="form-select"
                        value={editingCard.type || 'rfid'}
                        onChange={e => setEditingCard(c => ({ ...c!, type: e.target.value as any }))}
                      >
                        {Object.entries(CARD_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('ربط بمشترك', 'Assign to Member')}</label>
                      <select
                        className="form-select"
                        value={editingCard.customerId || ''}
                        onChange={e => setEditingCard(c => ({ ...c!, customerId: e.target.value }))}
                      >
                        <option value="">{t('— اختر مشترك —', '— Select member —')}</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('حالة البطاقة', 'Card Status')}</label>
                      <select
                        className="form-select"
                        value={editingCard.status || 'active'}
                        onChange={e => setEditingCard(c => ({ ...c!, status: e.target.value as any }))}
                      >
                        {Object.entries(CARD_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('ملاحظات', 'Notes')}</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={t('ملاحظات اختيارية', 'Optional notes')}
                        value={editingCard.notes || ''}
                        onChange={e => setEditingCard(c => ({ ...c!, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowCardModal(false)}>{t('إلغاء', 'Cancel')}</button>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        if (!editingCard.uid?.trim()) { alert(t('كود البطاقة مطلوب', 'Card UID is required')); return; }
                        if (!editingCard.customerId) { alert(t('يجب ربط البطاقة بمشترك', 'Please assign card to a member')); return; }
                        saveAccessCard({
                          id: editingCard.id || `CARD-${generateId()}`,
                          uid: editingCard.uid!.trim(),
                          type: editingCard.type || 'rfid',
                          status: editingCard.status || 'active',
                          customerId: editingCard.customerId!,
                          activatedAt: editingCard.activatedAt || new Date().toISOString(),
                          deactivatedAt: editingCard.deactivatedAt,
                          notes: editingCard.notes,
                        });
                        loadData();
                        setShowCardModal(false);
                        setEditingCard(null);
                      }}
                    >
                      {editingCard.id ? t('حفظ التعديلات', 'Save Changes') : t('إضافة البطاقة', 'Add Card')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 5 — MEMBER ACTIVITY
        ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'activity' && (
          <div>
            {/* Search */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{t('بحث عن مشترك', 'Search Member')}</h3>
              <div style={{ position: 'relative', maxWidth: '440px' }}>
                <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'right' : 'left']: '0.85rem', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingInlineStart: '2.5rem' }}
                  placeholder={t('اكتب الاسم أو رقم الهاتف...', 'Type name or phone...')}
                  value={activitySearch}
                  onChange={e => { setActivitySearch(e.target.value); setSelectedMember(null); }}
                />
              </div>
              {activityResults.length > 0 && !selectedMember && (
                <div style={{ marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxWidth: '440px' }}>
                  {activityResults.map(cust => (
                    <div
                      key={cust.id}
                      onClick={() => { setSelectedMember(cust); setActivitySearch(cust.name); }}
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{cust.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cust.phone}</div>
                      </div>
                      <Eye size={14} style={{ color: 'var(--text-muted)' }}/>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Member Stats */}
            {selectedMember && (() => {
              const stats = getMemberStats(selectedMember.id);
              const memberCard = cards.find(c => c.customerId === selectedMember.id);
              const memberLogs = logs
                .filter(l => l.customerId === selectedMember.id)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              const subStatus = getSubscriptionStatus(selectedMember.endDate);
              const isInside = activeSessions.some(s => s.customerId === selectedMember.id);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Profile header */}
                  <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', fontSize: '2rem', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedMember.gender === 'female' ? '👩' : '👨'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedMember.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedMember.phone}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {isInside && <span className="badge badge-success">{t('داخل الجيم الآن', 'Inside Gym')}</span>}
                        <span className={`badge ${subStatus === 'active' ? 'badge-success' : subStatus === 'expiring' ? 'badge-warning' : 'badge-danger'}`}>
                          {subStatus === 'active' ? t('اشتراك نشط', 'Active') : subStatus === 'expiring' ? t('ينتهي قريباً', 'Expiring') : t('منتهي', 'Expired')}
                        </span>
                        {memberCard && (
                          <span className={`badge ${CARD_STATUS_CONFIG[memberCard.status].badge}`} style={{ fontSize: '0.65rem' }}>
                            {CARD_TYPE_LABELS[memberCard.type]}: {memberCard.uid}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-4" style={{ gap: '1rem' }}>
                    {[
                      { label: t('إجمالي الزيارات', 'Total Visits'), value: stats.totalEntries, color: 'var(--primary)', icon: <LogIn size={20}/> },
                      { label: t('زيارات هذا الشهر', 'This Month'), value: stats.monthEntries, color: 'var(--success)', icon: <TrendingUp size={20}/> },
                      { label: t('متوسط مدة الزيارة', 'Avg Duration'), value: stats.avgDuration > 0 ? formatDuration(stats.avgDuration) : '—', color: 'var(--info)', icon: <Clock size={20}/> },
                      { label: t('محاولات مرفوضة', 'Denied Attempts'), value: stats.deniedCount, color: 'var(--danger)', icon: <Ban size={20}/> },
                    ].map(s => (
                      <div key={s.label} className="stat-card">
                        <div className="stat-card-info">
                          <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
                          <div className="stat-card-label">{s.label}</div>
                        </div>
                        <div className="stat-card-icon" style={{ background: 'var(--bg-tertiary)', color: s.color }}>{s.icon}</div>
                      </div>
                    ))}
                  </div>

                  {/* Member log history */}
                  <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '1rem' }}>
                      {t('سجل الحضور الكامل', 'Full Access History')}
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem', marginInlineStart: '0.5rem' }}>
                        ({memberLogs.length} {t('عملية', 'records')})
                      </span>
                    </h3>
                    <div className="table-container" style={{ margin: 0 }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>{t('التاريخ والوقت', 'Date & Time')}</th>
                            <th>{t('النوع', 'Type')}</th>
                            <th>{t('النتيجة', 'Result')}</th>
                            <th>{t('السبب', 'Reason')}</th>
                            <th>{t('البوابة', 'Gate')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memberLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                {t('لا يوجد سجل حضور لهذا المشترك', 'No attendance history for this member')}
                              </td>
                            </tr>
                          ) : memberLogs.slice(0, 50).map(log => (
                            <tr key={log.id} className={log.result === 'granted' ? 'log-row-granted' : 'log-row-denied'}>
                              <td style={{ fontSize: '0.8rem' }}>{formatDateTime(log.timestamp)}</td>
                              <td>
                                {log.entryType === 'entry'
                                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}><LogIn size={13}/>{t('دخول', 'Entry')}</span>
                                  : <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--info)', fontWeight: 600, fontSize: '0.85rem' }}><LogOut size={13}/>{t('خروج', 'Exit')}</span>
                                }
                              </td>
                              <td>
                                {log.result === 'granted'
                                  ? <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{t('مقبول', 'Granted')}</span>
                                  : <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>{t('مرفوض', 'Denied')}</span>
                                }
                              </td>
                              <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {log.reason ? (isAr ? REASON_LABELS[log.reason]?.ar : REASON_LABELS[log.reason]?.en) : '—'}
                              </td>
                              <td style={{ fontSize: '0.8rem' }}>{log.gate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </div>
    </AppShell>
  );
}
