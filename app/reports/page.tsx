'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/lib/context';
import { getCustomers, getPayments, getAttendance, getPlans } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, Download, TrendingUp, Users, Clock, Flame } from 'lucide-react';

export default function Reports() {
  const { settings, businessConfig, t } = useApp();

  // Stats States
  const [stats, setStats] = useState({
    activeCount: 0,
    expiredCount: 0,
    totalIncome: 0,
    totalCheckins: 0,
    peakHour: '6 PM - 9 PM',
    topCustomer: { name: '', count: 0 }
  });

  const loadData = () => {
    const customers = getCustomers();
    const payments = getPayments();
    const attendance = getAttendance();

    const active = customers.filter(c => new Date(c.endDate) >= new Date()).length;
    const expired = customers.length - active;

    const income = payments.reduce((sum, p) => sum + p.amount, 0);

    // Peak Check-in hours calculations
    const checkinHours = attendance.map(a => {
      const date = new Date(a.checkIn);
      return date.getHours();
    });

    const hoursFreq: Record<number, number> = {};
    checkinHours.forEach(h => {
      hoursFreq[h] = (hoursFreq[h] || 0) + 1;
    });

    let peakHr = '6 PM - 9 PM';
    let maxFreq = 0;
    Object.entries(hoursFreq).forEach(([hr, freq]) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        const hrNum = parseInt(hr);
        const nextHr = (hrNum + 1) % 24;
        const formatHr = (h: number) => h === 0 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`;
        peakHr = `${formatHr(hrNum)} - ${formatHr(nextHr)}`;
      }
    });

    // Top attending member
    const attendanceByCustomer: Record<string, number> = {};
    attendance.forEach(a => {
      attendanceByCustomer[a.customerId] = (attendanceByCustomer[a.customerId] || 0) + 1;
    });

    let topCustId = '';
    let topCustCount = 0;
    Object.entries(attendanceByCustomer).forEach(([custId, count]) => {
      if (count > topCustCount) {
        topCustCount = count;
        topCustId = custId;
      }
    });

    const topCustomerObj = customers.find(c => c.id === topCustId);

    setStats({
      activeCount: active,
      expiredCount: expired,
      totalIncome: income,
      totalCheckins: attendance.length,
      peakHour: peakHr,
      topCustomer: {
        name: topCustomerObj ? topCustomerObj.name : '-',
        count: topCustCount
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Browser-based CSV Exporter
  const handleExportCSV = () => {
    const customers = getCustomers();
    const plans = getPlans();
    
    // Arabic CSV Headers + English support
    const headers = [
      t('الكود الشخصي', 'Subscriber Code'),
      t('الاسم', 'Name'),
      t('الهاتف', 'Phone'),
      t('الجنس', 'Gender'),
      t('البريد الالكتروني', 'Email'),
      t('اسم الباقة الحالية', 'Current Plan'),
      t('تاريخ بدء الاشتراك', 'Start Date'),
      t('تاريخ انتهاء الاشتراك', 'End Date'),
      t('الحالة المالية', 'Payment Status'),
      t('الذمم المالية المعلقة', 'Due Balance'),
      t('تاريخ التسجيل', 'Created At')
    ];

    const rows = customers.map(c => {
      const plan = plans.find(p => p.id === c.planId);
      return [
        c.id,
        c.name,
        c.phone,
        c.gender === 'male' ? t('ذكر', 'Male') : t('أنثى', 'Female'),
        c.email || '',
        plan ? plan.name : '',
        c.startDate,
        c.endDate,
        c.paymentStatus,
        c.balance,
        c.createdAt
      ];
    });

    // UTF-8 CSV BOM prefix to correctly render Arabic letters in Excel
    let csvContent = '\uFEFF'; 
    csvContent += [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${settings.businessName.replace(/\s+/g, '_')}_subscribers.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="page-container animate-fade-in">
        
        {/* Title */}
        <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('التقارير والإحصائيات التحليلية', 'Reports & Business Intelligence')}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('مراقبة إيرادات الاشتراكات الإجمالية، أوقات ذروة الحضور، وتصدير قواعد البيانات.', 'Monitor subscription income, peak attendance periods, and export membership databases.')}
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={16} /> {t('تصدير قائمة المشتركين كـ CSV', 'Export Subscribers to CSV')}
          </button>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-3 mb-3">
          
          {/* Revenue MTD */}
          <div className="stat-card" style={{ '--accent-gradient': 'var(--success)' } as React.CSSProperties}>
            <div className="stat-card-info">
              <span className="stat-card-value">{formatCurrency(stats.totalIncome, settings.currency, settings.language)}</span>
              <span className="stat-card-label">{t('إجمالي المبيعات والتحصيلات الكلية', 'Total Accumulated Sales')}</span>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
              <TrendingUp size={24} />
            </div>
          </div>

          {/* Growth */}
          <div className="stat-card" style={{ '--accent-gradient': 'var(--primary)' } as React.CSSProperties}>
            <div className="stat-card-info">
              <span className="stat-card-value">{stats.activeCount}</span>
              <span className="stat-card-label">{t('عدد المشتركين الفعالين حالياً', 'Total Active Customers')}</span>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Users size={24} />
            </div>
          </div>

          {/* Checkins Count */}
          <div className="stat-card" style={{ '--accent-gradient': 'var(--info)' } as React.CSSProperties}>
            <div className="stat-card-info">
              <span className="stat-card-value">{stats.totalCheckins}</span>
              <span className="stat-card-label">{t('إجمالي عمليات الحضور المسجلة', 'Total Access Check-ins')}</span>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)' }}>
              <BarChart3 size={24} />
            </div>
          </div>
        </div>

        {/* Dynamic Detail Insights */}
        <div className="grid grid-2 mb-3">
          
          {/* Peak Attendance Hours */}
          <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem' }}>
            <Flame size={48} style={{ color: 'var(--warning)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }} className="mb-05">{t('ساعات الذروة الأكثر نشاطاً', 'Peak Attendance Hours')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }} className="mb-2">
              {t('أكثر الفترات الزمنية تسجيلاً لعمليات الدخول وحضور المشتركين.', 'The hourly blocks that record the highest check-in traffic.')}
            </p>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>
              {stats.peakHour}
            </div>
          </div>

          {/* Most Active Member */}
          <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem' }}>
            <Users size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }} className="mb-05">{t('المشترك الأكثر حضوراً وتواجداً', 'Most Active Member')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }} className="mb-2">
              {t('المشترك الأكثر التزاماً بالحضور وتسجيل الدخول طوال فترة اشتراكه.', 'The member with the highest number of check-in records.')}
            </p>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }} className="mb-05">
              {stats.topCustomer.name}
            </div>
            <span className="badge badge-success">
              {t(`سجل ${stats.topCustomer.count} زيارات حضور`, `${stats.topCustomer.count} visits logged`)}
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
