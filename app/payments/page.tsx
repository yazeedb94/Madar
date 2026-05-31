'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/lib/context';
import { getPayments, getCustomers, getPlans } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Clock, FileText, Calendar, Filter } from 'lucide-react';

export default function Payments() {
  const { settings, t } = useApp();

  // Core Data States
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  // Analytics Metrics
  const [metrics, setMetrics] = useState({
    totalCollected: 0,
    totalOutstanding: 0,
    cashCount: 0,
    cardCount: 0,
  });

  // Filter States
  const [methodFilter, setMethodFilter] = useState('all');
  const [invoiceToPrint, setInvoiceToPrint] = useState<any>(null);
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const loadData = () => {
    const allPayments = getPayments().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const allCustomers = getCustomers();
    const allPlans = getPlans();

    setPayments(allPayments);
    setCustomers(allCustomers);
    setPlans(allPlans);

    // Calculate Analytics
    let totalPaid = 0;
    let cash = 0;
    let card = 0;

    allPayments.forEach(p => {
      totalPaid += p.amount;
      if (p.method === 'cash') cash += p.amount;
      else if (p.method === 'card') card += p.amount;
    });

    const outstanding = allCustomers.reduce((sum, c) => sum + (c.balance || 0), 0);

    setMetrics({
      totalCollected: totalPaid,
      totalOutstanding: outstanding,
      cashCount: cash,
      cardCount: card
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenInvoice = (payObj: any) => {
    const cust = customers.find(c => c.id === payObj.customerId);
    const plan = cust ? plans.find(p => p.id === cust.planId) : null;
    setSelectedCust(cust);
    setSelectedPlan(plan);
    setInvoiceToPrint(payObj);
  };

  const filteredPayments = payments.filter(p => {
    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;
    return matchesMethod;
  });

  return (
    <AppShell>
      <div className="page-container animate-fade-in">
        
        {/* Title */}
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }} className="mb-1">
          {t('المدفوعات والمستحقات المالية', 'Payments & Receivables')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mb-3">
          {t('عرض العمليات المالية المحصلة، السحوبات، والتحقق من أرصدة الذمم المعلقة للعملاء.', 'View collected revenues, financial transactions, and review outstanding accounts receivable.')}
        </p>

        {/* Finance Metric Cards */}
        <div className="grid grid-3 mb-3">
          
          {/* Total Collected */}
          <div className="stat-card" style={{ '--accent-gradient': 'var(--success)' } as React.CSSProperties}>
            <div className="stat-card-info">
              <span className="stat-card-value">{formatCurrency(metrics.totalCollected, settings.currency, settings.language)}</span>
              <span className="stat-card-label">{t('إجمالي المبالغ المحصلة', 'Total Revenue Collected')}</span>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
              <DollarSign size={24} />
            </div>
          </div>

          {/* Accounts Receivable */}
          <div className="stat-card" style={{ '--accent-gradient': 'var(--danger)' } as React.CSSProperties}>
            <div className="stat-card-info">
              <span className="stat-card-value">{formatCurrency(metrics.totalOutstanding, settings.currency, settings.language)}</span>
              <span className="stat-card-label">{t('إجمالي الذمم المالية المعلقة', 'Outstanding Balances (Receivables)')}</span>
            </div>
            <div className="stat-card-icon" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
              <Clock size={24} />
            </div>
          </div>

          {/* Cash vs Card */}
          <div className="stat-card" style={{ '--accent-gradient': 'var(--primary)' } as React.CSSProperties}>
            <div className="stat-card-info">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} className="mb-1">
                {t('نقدي مقابل شبكة / تحويل:', 'Payment Methods Ratio:')}
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                💵 {formatCurrency(metrics.cashCount, settings.currency, settings.language)} <br />
                💳 {formatCurrency(metrics.cardCount, settings.currency, settings.language)}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="search-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} style={{ color: 'var(--text-muted)' }} />
            <select className="form-select" style={{ width: 'auto' }} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
              <option value="all">{t('جميع وسائل الدفع', 'All Methods')}</option>
              <option value="cash">{t('نقداً فقط', 'Cash Only')}</option>
              <option value="card">{t('شبكة / بطاقات ائتمان', 'Card Only')}</option>
              <option value="transfer">{t('حوالة بنكية', 'Bank Transfer Only')}</option>
            </select>
          </div>
        </div>

        {/* Table of payments */}
        {filteredPayments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <div className="empty-state-text">{t('لم يتم تسجيل أي عمليات دفع بعد.', 'No financial transactions logged yet.')}</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('رقم الفاتورة', 'Invoice ID')}</th>
                  <th>{t('المشترك / العميل', 'Member / Client')}</th>
                  <th>{t('المبلغ المحصل', 'Amount Paid')}</th>
                  <th>{t('طريقة الدفع', 'Method')}</th>
                  <th>{t('تاريخ المعاملة', 'Date')}</th>
                  <th>{t('تفاصيل وملاحظات', 'Notes')}</th>
                  <th>{t('التحصيل الفاتورة', 'Receipt')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(pay => {
                  const cust = customers.find(c => c.id === pay.customerId);
                  return (
                    <tr key={pay.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{pay.id}</td>
                      <td style={{ fontWeight: 600 }}>{cust ? cust.name : t('مشترك محذوف', 'Deleted Member')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                        {formatCurrency(pay.amount, settings.currency, settings.language)}
                      </td>
                      <td>
                        {pay.method === 'cash' && t('نقداً', 'Cash')}
                        {pay.method === 'card' && t('شبكة / بطاقة', 'Credit Card')}
                        {pay.method === 'transfer' && t('تحويل بنكي', 'Bank Transfer')}
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <Calendar size={12} />
                          {new Date(pay.date).toLocaleDateString(settings.language === 'ar' ? 'ar-EG' : 'en-US')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pay.notes || '-'}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenInvoice(pay)}>
                          <FileText size={12} /> {t('معاينة وطباعة', 'Print Invoice')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Printable Invoice Modal */}
        {invoiceToPrint && selectedCust && (
          <div className="modal-overlay">
            <div className="modal modal-lg">
              <div className="modal-header">
                <h3>{t('معاينة وطباعة الفاتورة والتحصيل', 'Invoice Preview')}</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setInvoiceToPrint(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="invoice-container">
                  <div className="invoice-header">
                    <div>
                      <h2 style={{ color: 'var(--primary)', fontWeight: 800 }}>{settings.businessName}</h2>
                      <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{t('إيصال تحصيل اشتراك رسمي', 'Official Payment Receipt')}</p>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>#{invoiceToPrint.id}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {t('التاريخ:', 'Date:')} {new Date(invoiceToPrint.date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>

                  <div className="invoice-details">
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('المشترك / العميل:', 'Billed To:')}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{selectedCust.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{t('رقم الجوال:', 'Phone:')} {selectedCust.phone}</div>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('الباقة المشترك فيها:', 'Plan:')}</div>
                      <div style={{ fontWeight: 'bold' }}>
                        {selectedPlan ? (settings.language === 'ar' ? selectedPlan.name : selectedPlan.nameEn) : ''}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {t('الصلاحية من:', 'Valid from:')} {selectedCust.startDate} {t('إلى', 'to')} {selectedCust.endDate}
                      </div>
                    </div>
                  </div>

                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>{t('الوصف وتفاصيل العملية', 'Description')}</th>
                        <th style={{ textAlign: 'end' }}>{t('المجموع المحصل', 'Paid Amount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          {t('تحصيل دفعة مالية لـ ', 'Payment logged for ')} 
                          {selectedPlan ? (settings.language === 'ar' ? selectedPlan.name : selectedPlan.nameEn) : ''} 
                          {invoiceToPrint.notes ? ` (${invoiceToPrint.notes})` : ''}
                        </td>
                        <td style={{ textAlign: 'end', fontWeight: 'bold' }}>
                          {formatCurrency(invoiceToPrint.amount, settings.currency, settings.language)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="invoice-total">
                    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'flex-end', borderTop: '2px solid #cbd5e1', paddingTop: '0.5rem', width: '250px' }}>
                      <span>{t('إجمالي المسدد:', 'Total Paid:')}</span>
                      <span style={{ fontWeight: 800, color: 'green' }}>
                        {formatCurrency(invoiceToPrint.amount, settings.currency, settings.language)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setInvoiceToPrint(null)}>{t('إغلاق', 'Close')}</button>
                <button className="btn btn-primary" onClick={() => window.print()}>{t('طباعة الفاتورة والتحصيل', 'Print Receipt PDF')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
