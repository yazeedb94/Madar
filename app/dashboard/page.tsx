'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/lib/context';
import { getCustomers, getPayments, getAttendance, getNotifications } from '@/lib/store';
import { getRemainingDays, formatCurrency } from '@/lib/utils';
import { 
  Users, 
  UserMinus, 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { settings, businessConfig, t, triggerCount } = useApp();
  const router = useRouter();

  // Dashboard Stats States
  const [stats, setStats] = useState({
    activeCount: 0,
    expiredCount: 0,
    monthlyRevenue: 0,
    todayCheckins: 0,
  });

  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [dailyRevenue, setDailyRevenue]       = useState<number[]>(Array(7).fill(0));
  const [dailyAttendance, setDailyAttendance] = useState<number[]>(Array(7).fill(0));
  const [dailyRegistrations, setDailyRegistrations] = useState<number[]>(Array(7).fill(0));
  const [dayLabels, setDayLabels]             = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const customers = getCustomers();
    const payments  = getPayments();
    const attendance = getAttendance();

    // 1. KPIs
    let active = 0, expired = 0;
    const expiringList: any[] = [];

    customers.forEach(c => {
      const remaining = getRemainingDays(c.endDate);
      if (remaining >= 0) {
        active++;
        if (remaining <= 7) expiringList.push({ ...c, remainingDays: remaining });
      } else { expired++; }
    });
    expiringList.sort((a, b) => a.remainingDays - b.remainingDays);

    const now   = new Date();
    const mRev  = payments
      .filter(p => { const d = new Date(p.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status === 'completed'; })
      .reduce((s, p) => s + p.amount, 0);

    const todayStr = now.toISOString().split('T')[0];
    const todayAtt = attendance.filter(a => a.date === todayStr).length;

    setStats({ activeCount: active, expiredCount: expired, monthlyRevenue: mRev, todayCheckins: todayAtt });
    setExpiringMembers(expiringList.slice(0, 5));

    const sorted = [...payments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(p => ({ ...p, customerName: customers.find(c => c.id === p.customerId)?.name ?? t('مشترك غير معروف', 'Unknown Member') }))
      .slice(0, 5);
    setRecentPayments(sorted);

    // 2. Build last-7-days buckets
    const rev7  = Array(7).fill(0);
    const att7  = Array(7).fill(0);
    const reg7  = Array(7).fill(0);
    const labels: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      labels.push(
        d.toLocaleDateString(settings.language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' })
      );
      const idx = 6 - i;
      rev7[idx]  = payments.filter(p => p.date?.startsWith(key) && p.status === 'completed').reduce((s, p) => s + p.amount, 0);
      att7[idx]  = attendance.filter(a => (a.date || a.checkIn || '').startsWith(key)).length;
      reg7[idx]  = customers.filter(c => (c.createdAt || '').startsWith(key)).length;
    }

    setDailyRevenue(rev7);
    setDailyAttendance(att7);
    setDailyRegistrations(reg7);
    setDayLabels(labels);
  }, [settings.language, triggerCount]);


  /* ── Chart geometry (SVG 500×180 canvas) ── */
  const W = 500, H = 180, PAD_L = 40, PAD_R = 20, PAD_T = 15, PAD_B = 5;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const N = 7;

  const maxRev = Math.max(...dailyRevenue, 1);
  const maxAtt = Math.max(...dailyAttendance, 1);
  const maxReg = Math.max(...dailyRegistrations, 1);

  const xOf = (i: number) => PAD_L + (i / (N - 1)) * chartW;
  const yOf = (val: number, max: number) => PAD_T + chartH - (val / max) * chartH;

  const revPts  = dailyRevenue.map((v, i)       => `${xOf(i)},${yOf(v, maxRev)}`);
  const attPts  = dailyAttendance.map((v, i)    => `${xOf(i)},${yOf(v, maxAtt)}`);
  const regPts  = dailyRegistrations.map((v, i) => `${xOf(i)},${yOf(v, maxReg)}`);

  const polyLine = (pts: string[]) => pts.join(' ');
  const areaPath = (pts: string[]) => {
    const first = `${xOf(0)},${PAD_T + chartH}`;
    const last  = `${xOf(N - 1)},${PAD_T + chartH}`;
    return `M ${first} L ${pts.join(' L ')} L ${last} Z`;
  };

  const hasAnyData = dailyRevenue.some(v => v > 0) || dailyAttendance.some(v => v > 0) || dailyRegistrations.some(v => v > 0);


  return (
    <AppShell>
      <div className="page-container animate-fade-in">
        {/* Top Header Row with Quick Actions */}
        <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('نظرة عامة', 'Dashboard')}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('متابعة فورية للمشتركين، الاشتراكات الفعالة، والعمليات المالية الجارية.', 'Real-time tracking of memberships, active plans, and payments.')}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/customers?add=true">
              <button className="btn btn-primary">
                <Plus size={16} /> 
                {t(`إضافة ${businessConfig.memberLabel.ar}`, `Add ${businessConfig.memberLabel.en}`)}
              </button>
            </Link>
            <Link href="/attendance">
              <button className="btn btn-secondary">
                <Activity size={16} /> 
                {t('تسجيل حضور سريع', 'Quick Check-in')}
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-4 mb-3">
          {/* Active Members */}
          <div className="stat-card">
            <div className="stat-card-info">
              <span className="stat-card-value">{stats.activeCount}</span>
              <span className="stat-card-label">
                {t(`${businessConfig.membersLabel.ar} النشطين`, `Active ${businessConfig.membersLabel.en}`)}
              </span>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
              <Users size={24} />
            </div>
          </div>

          {/* Expired Members */}
          <div className="stat-card" style={{ '--accent-gradient': 'var(--danger)' } as React.CSSProperties}>
            <div className="stat-card-info">
              <span className="stat-card-value">{stats.expiredCount}</span>
              <span className="stat-card-label">
                {t(`${businessConfig.membersLabel.ar} المنتهية باقاتهم`, `Expired ${businessConfig.membersLabel.en}`)}
              </span>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
              <UserMinus size={24} />
            </div>
          </div>

          {/* Revenue */}
          <div className="stat-card" style={{ '--accent-gradient': 'var(--warning)' } as React.CSSProperties}>
            <div className="stat-card-info">
              <span className="stat-card-value">{formatCurrency(stats.monthlyRevenue, settings.currency, settings.language)}</span>
              <span className="stat-card-label">{t('إيرادات الشهر الحالي', 'MTD Revenue')}</span>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
              <DollarSign size={24} />
            </div>
          </div>

          {/* Daily Attendance */}
          <div className="stat-card" style={{ '--accent-gradient': 'var(--info)' } as React.CSSProperties}>
            <div className="stat-card-info">
              <span className="stat-card-value">{stats.todayCheckins}</span>
              <span className="stat-card-label">{t('عمليات التحضير اليوم', 'Today\'s Attendance')}</span>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)' }}>
              <Activity size={24} />
            </div>
          </div>
        </div>

        {/* Dynamic Analytics & Warning Sections */}
        <div className="responsive-grid-2-1 mb-3">
          
          {/* Revenue & Checkins Graph */}
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 className="card-title">{t('نشاط الاشتراكات والمدفوعات مؤخراً', 'Subscriptions & Payments Activity')}</h3>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'inline-block', width: 14, height: 3, backgroundColor: 'var(--primary)', borderRadius: 2 }} />
                  {t('الإيرادات', 'Revenue')}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'inline-block', width: 14, height: 3, background: '#22d3ee', borderRadius: 2 }} />
                  {t('الحضور', 'Attendance')}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'inline-block', width: 14, height: 3, background: '#a78bfa', borderRadius: 2 }} />
                  {t('تسجيلات جديدة', 'New Registrations')}
                </span>
                <span className="badge badge-success">{t('آخر 7 أيام', 'Last 7 Days')}</span>
              </div>
            </div>

            {!hasAnyData ? (
              <div className="text-center" style={{ padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Activity size={40} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.9rem' }}>{t('لا توجد بيانات للأيام السبعة الماضية بعد.', 'No activity data for the last 7 days yet.')}</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{t('أضف مشتركين أو سجّل حضوراً لترى الرسم البياني.', 'Add members or record attendance to see the chart.')}</p>
              </div>
            ) : (
              <div style={{ marginTop: '1.25rem', overflowX: 'auto' }}>
                <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" style={{ minWidth: 280, display: 'block' }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Y-axis guide lines + labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
                    const y = PAD_T + chartH - frac * chartH;
                    const val = Math.round(maxRev * frac);
                    return (
                      <g key={idx}>
                        <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                          stroke="var(--border-color)" strokeWidth="0.6" strokeDasharray={frac === 0 ? 'none' : '4 4'} />
                        <text x={PAD_L - 4} y={y + 4} textAnchor="end"
                          fontSize="9" fill="var(--text-muted)">
                          {val > 999 ? `${(val/1000).toFixed(1)}k` : val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Filled area – Revenue */}
                  <path d={areaPath(revPts)} fill="url(#gRev)" />
                  {/* Filled area – Attendance */}
                  <path d={areaPath(attPts)} fill="url(#gAtt)" />

                  {/* Lines */}
                  <polyline points={polyLine(revPts)} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={polyLine(attPts)} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3" />
                  <polyline points={polyLine(regPts)} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Dots + value labels – Revenue */}
                  {dailyRevenue.map((v, i) => (
                    <g key={`r${i}`}>
                      <title>{`${dayLabels[i]}: ${v} ${settings.currency}`}</title>
                      <circle cx={xOf(i)} cy={yOf(v, maxRev)} r={v > 0 ? 5 : 3}
                        fill={v > 0 ? 'var(--primary)' : 'var(--border-color)'}
                        stroke="var(--bg-secondary)" strokeWidth="2" />
                      {v > 0 && (
                        <text x={xOf(i)} y={yOf(v, maxRev) - 8} textAnchor="middle"
                          fontSize="9" fill="var(--primary)" fontWeight="700">
                          {v > 999 ? `${(v/1000).toFixed(1)}k` : v}
                        </text>
                      )}
                    </g>
                  ))}

                  {/* Dots – Attendance */}
                  {dailyAttendance.map((v, i) => (
                    <g key={`a${i}`}>
                      <title>{`${dayLabels[i]}: ${v} ${t('حضور', 'checkins')}`}</title>
                      <circle cx={xOf(i)} cy={yOf(v, maxAtt)} r={v > 0 ? 4 : 3}
                        fill={v > 0 ? '#22d3ee' : 'var(--border-color)'}
                        stroke="var(--bg-secondary)" strokeWidth="1.5" />
                    </g>
                  ))}

                  {/* Dots – Registrations */}
                  {dailyRegistrations.map((v, i) => (
                    <g key={`g${i}`}>
                      <title>{`${dayLabels[i]}: ${v} ${t('تسجيل جديد', 'new')}`}</title>
                      <circle cx={xOf(i)} cy={yOf(v, maxReg)} r={v > 0 ? 4 : 3}
                        fill={v > 0 ? '#a78bfa' : 'var(--border-color)'}
                        stroke="var(--bg-secondary)" strokeWidth="1.5" />
                      {v > 0 && (
                        <text x={xOf(i)} y={yOf(v, maxReg) - 7} textAnchor="middle"
                          fontSize="9" fill="#a78bfa" fontWeight="700">{v}</text>
                      )}
                    </g>
                  ))}

                  {/* X-axis day labels */}
                  {dayLabels.map((label, i) => (
                    <text key={`l${i}`} x={xOf(i)} y={H + 18} textAnchor="middle"
                      fontSize="10" fill="var(--text-muted)">
                      {label}
                    </text>
                  ))}
                </svg>
              </div>
            )}
          </div>

          {/* Expiring memberships panel */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
                <span>{t('اشتراكات تقترب من الانتهاء', 'Expiring Soon')}</span>
              </h3>
              <span className="badge badge-warning" style={{ borderRadius: '4px' }}>
                {t('خلال 7 أيام', '7 days left')}
              </span>
            </div>

            {expiringMembers.length === 0 ? (
              <div className="text-center" style={{ padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                <CheckCircle size={32} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem' }}>{t('لا توجد اشتراكات تنتهي قريباً', 'No memberships ending soon!')}</p>
              </div>
            ) : (
              <div className="flex-column" style={{ gap: '0.75rem', marginTop: '0.5rem' }}>
                {expiringMembers.map(member => (
                  <div 
                    key={member.id} 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{member.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.phone}</div>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <span className="badge badge-warning" style={{ padding: '0.2rem 0.5rem' }}>
                        {t(`متبقي ${member.remainingDays} أيام`, `${member.remainingDays} days left`)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Financial & General Recent Activity Log */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('آخر العمليات المالية المسجلة', 'Recent Financial Transactions')}</h3>
            <Link href="/payments" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
              {t('عرض جميع الفواتير ←', 'View all invoices →')}
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
              <p>{t('لا توجد عمليات مالية مسجلة بعد.', 'No financial transactions logged yet.')}</p>
            </div>
          ) : (
            <div className="table-container" style={{ margin: '1rem 0 0' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('المشترك / العميل', 'Member / Client')}</th>
                    <th>{t('المبلغ المدفوع', 'Amount Paid')}</th>
                    <th>{t('طريقة الدفع', 'Payment Method')}</th>
                    <th>{t('تاريخ العملية', 'Date')}</th>
                    <th>{t('الحالة', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map(pay => (
                    <tr key={pay.id}>
                      <td style={{ fontWeight: 600 }}>{pay.customerName}</td>
                      <td>{formatCurrency(pay.amount, settings.currency, settings.language)}</td>
                      <td>
                        {pay.method === 'cash' && t('نقداً', 'Cash')}
                        {pay.method === 'card' && t('بطاقة ائتمانية', 'Credit Card')}
                        {pay.method === 'transfer' && t('تحويل بنكي', 'Bank Transfer')}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} />
                          {new Date(pay.date).toLocaleDateString(settings.language === 'ar' ? 'ar-EG' : 'en-US')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${pay.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                          {pay.status === 'completed' ? t('ناجحة', 'Completed') : t('معلقة', 'Pending')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
