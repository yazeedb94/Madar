'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/lib/context';
import { 
  getCustomers, 
  saveCustomer, 
  getPlans, 
  getPayments, 
  savePayment, 
  getAttendance,
  deleteCustomer
} from '@/lib/store';
import { getRemainingDays, getSubscriptionStatus, formatCurrency, generateId } from '@/lib/utils';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  FileText, 
  Settings, 
  Play, 
  Pause,
  Trash2,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerProfile() {
  const { settings, businessConfig, t, refreshData } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // States
  const [customer, setCustomer] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  // Modal States
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<any>(null);

  // Renewal Form
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [renewStartDate, setRenewStartDate] = useState('');
  const [renewPaymentStatus, setRenewPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [renewBalance, setRenewBalance] = useState(0);

  // Log Payment Form
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [payNotes, setPayNotes] = useState('');

  const loadData = () => {
    const customers = getCustomers();
    const cust = customers.find(c => c.id === id);
    if (!cust) {
      alert(t('المشترك غير موجود!', 'Subscriber not found!'));
      router.push('/customers');
      return;
    }

    const plans = getPlans();
    const currentPlan = plans.find(p => p.id === cust.planId);

    const custPayments = getPayments().filter(p => p.customerId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const custAttendance = getAttendance().filter(a => a.customerId === id)
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());

    setCustomer(cust);
    setPlan(currentPlan);
    setAllPlans(plans.filter(p => p.isActive));
    setPayments(custPayments);
    setAttendance(custAttendance);

    // Form defaults
    setSelectedPlanId(cust.planId);
    
    // Default renewal start is max(today, customerEndDate)
    const today = new Date().toISOString().split('T')[0];
    const expiry = cust.endDate;
    const defaultStart = new Date(expiry) > new Date() ? expiry : today;
    setRenewStartDate(defaultStart);
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  // Renew Subscription Action
  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPlan = allPlans.find(p => p.id === selectedPlanId);
    if (!selectedPlan || !customer) return;

    // Calculate End Date
    const start = new Date(renewStartDate);
    const end = new Date(renewStartDate);
    if (selectedPlan.durationType === 'days') {
      end.setDate(start.getDate() + selectedPlan.duration);
    } else if (selectedPlan.durationType === 'months') {
      end.setMonth(start.getMonth() + selectedPlan.duration);
    } else {
      end.setFullYear(start.getFullYear() + selectedPlan.duration);
    }

    const newBalanceValue = renewPaymentStatus === 'unpaid' ? selectedPlan.price : renewPaymentStatus === 'partial' ? renewBalance : 0;

    const updatedCustomer = {
      ...customer,
      planId: selectedPlanId,
      startDate: renewStartDate,
      endDate: end.toISOString().split('T')[0],
      paymentStatus: renewPaymentStatus,
      balance: newBalanceValue,
      notes: t('تم تجديد الاشتراك بنجاح', 'Subscription renewed successfully')
    };

    saveCustomer(updatedCustomer);

    // Save corresponding payment
    if (renewPaymentStatus !== 'unpaid') {
      const amountPaid = renewPaymentStatus === 'paid' ? selectedPlan.price : (selectedPlan.price - renewBalance);
      savePayment({
        id: `PAY-${generateId()}`,
        customerId: customer.id,
        amount: amountPaid,
        date: new Date().toISOString(),
        method: 'cash',
        status: 'completed',
        notes: t('دفعة تجديد باقة الاشتراك', 'Subscription renewal payment')
      });
    }

    setShowRenewModal(false);
    loadData();
    refreshData();
  };

  // Log Pending Payment Action
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || payAmount <= 0) return;

    const finalBalance = Math.max(0, customer.balance - payAmount);
    let finalPaymentStatus: 'paid' | 'partial' | 'unpaid' = 'paid';
    if (finalBalance > 0) {
      finalPaymentStatus = 'partial';
    }

    const updatedCustomer = {
      ...customer,
      paymentStatus: finalPaymentStatus,
      balance: finalBalance
    };

    saveCustomer(updatedCustomer);

    // Log the transaction
    savePayment({
      id: `PAY-${generateId()}`,
      customerId: customer.id,
      amount: payAmount,
      date: new Date().toISOString(),
      method: payMethod,
      status: 'completed',
      notes: payNotes || t('تسوية رصيد معلق', 'Balance settlement')
    });

    setShowPayModal(false);
    setPayAmount(0);
    setPayNotes('');
    loadData();
    refreshData();
  };

  // Toggle freeze subscription (Demo mock)
  const toggleFreeze = () => {
    if (!customer) return;
    const isFrozen = customer.notes?.includes('[FREEZE]');
    let updatedNotes = customer.notes || '';

    if (isFrozen) {
      updatedNotes = updatedNotes.replace('[FREEZE] ', '');
      alert(t('تم تفعيل وتجميد فك الاشتراك بنجاح.', 'Subscription unfrozen successfully.'));
    } else {
      updatedNotes = '[FREEZE] ' + updatedNotes;
      alert(t('تم تجميد هذا الاشتراك بنجاح. لن يتمكن المشترك من الدخول مؤقتاً.', 'Subscription frozen. Check-in blocked.'));
    }

    saveCustomer({
      ...customer,
      notes: updatedNotes
    });
    loadData();
  };

  // Delete Customer
  const handleDeleteProfile = () => {
    if (confirm(t('هل أنت متأكد من حذف هذا المشترك نهائياً من قاعدة البيانات؟', 'Delete profile permanently?'))) {
      deleteCustomer(customer.id);
      router.push('/customers');
    }
  };

  if (!customer) return null;

  const subStatus = getSubscriptionStatus(customer.endDate);
  const remaining = getRemainingDays(customer.endDate);
  const isFrozen = customer.notes?.includes('[FREEZE]');

  return (
    <AppShell>
      <div className="page-container animate-fade-in">
        
        {/* Back Link */}
        <Link href="/customers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 600 }}>
          <ChevronLeft size={16} /> {t('العودة لقائمة المشتركين', 'Back to Subscribers')}
        </Link>

        {/* Profile Card Header */}
        <div className="grid grid-3 mb-3" style={{ gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          
          {/* Main Info Card */}
          <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '4.5rem', marginBottom: '1rem' }}>{customer.gender === 'male' ? '👨' : '👩'}</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }} className="mb-1">{customer.name}</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} className="mb-2">{customer.id}</span>
            
            {/* Status Badges */}
            <div className="flex-center gap-1 mb-3">
              {isFrozen ? (
                <span className="badge badge-warning">{t('مجمد مؤقتاً', 'Frozen')}</span>
              ) : (
                <>
                  {subStatus === 'active' && <span className="badge badge-success">{t('اشتراك نشط', 'Active')}</span>}
                  {subStatus === 'expiring' && <span className="badge badge-warning">{t('ينتهي قريباً', 'Expiring')}</span>}
                  {subStatus === 'expired' && <span className="badge badge-danger">{t('اشتراك منتهي', 'Expired')}</span>}
                </>
              )}

              {customer.paymentStatus === 'paid' && <span className="badge badge-success">{t('مسدد كامل', 'Paid')}</span>}
              {customer.paymentStatus === 'partial' && <span className="badge badge-warning">{t('ذمم متبقية', 'Due Balance')}</span>}
              {customer.paymentStatus === 'unpaid' && <span className="badge badge-danger">{t('غير مسدد', 'Unpaid')}</span>}
            </div>

            {/* Main Action Buttons */}
            <div className="flex-column gap-1" style={{ width: '100%' }}>
              <button className="btn btn-primary" onClick={() => setShowRenewModal(true)}>
                <RefreshCw size={16} /> {t('تجديد الاشتراك', 'Renew Subscription')}
              </button>
              
              {customer.balance > 0 && (
                <button className="btn btn-success" onClick={() => { setPayAmount(customer.balance); setShowPayModal(true); }}>
                  <DollarSign size={16} /> {t('تسجيل دفعة معلقة', 'Pay Balance')}
                </button>
              )}

              <button className={`btn ${isFrozen ? 'btn-success' : 'btn-secondary'}`} onClick={toggleFreeze}>
                {isFrozen ? <Play size={16} /> : <Pause size={16} />}
                {isFrozen ? t('إلغاء التجميد', 'Unfreeze Subscription') : t('تجميد الاشتراك', 'Freeze Subscription')}
              </button>

              <button className="btn btn-danger" onClick={handleDeleteProfile}>
                <Trash2 size={16} /> {t('حذف الحساب بالكامل', 'Delete Profile')}
              </button>
            </div>
          </div>

          {/* Profile Specs Cards */}
          <div className="flex-column gap-2">
            
            {/* Specs Detail */}
            <div className="card">
              <h3 className="card-title mb-2">{t('تفاصيل البيانات الشخصية والاشتراك', 'Account & Subscription Details')}</h3>
              
              <div className="grid grid-2" style={{ gap: '1.25rem 2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Phone size={18} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('رقم الجوال', 'Phone')}</div>
                    <div style={{ fontWeight: 600 }}>{customer.phone}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Mail size={18} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('البريد الإلكتروني', 'Email')}</div>
                    <div style={{ fontWeight: 600 }}>{customer.email || t('غير مسجل', 'Not registered')}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Settings size={18} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t(`نوع الباقة`, `Current Plan`)}</div>
                    <div style={{ fontWeight: 600 }}>
                      {plan ? (settings.language === 'ar' ? plan.name : plan.nameEn) : t('لا يوجد', 'None')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('صلاحية الاشتراك', 'Subscription Dates')}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {customer.startDate} {t('إلى', 'to')} {customer.endDate}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock size={18} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('الأيام المتبقية', 'Days Remaining')}</div>
                    <div style={{ fontWeight: 700, color: remaining < 0 ? 'var(--danger)' : remaining <= 7 ? 'var(--warning)' : 'var(--success)' }}>
                      {remaining < 0 ? t('منتهي الصلاحية', 'Expired') : t(`${remaining} يوم`, `${remaining} days`)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <DollarSign size={18} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('الرصيد المتبقي (الذمة المالية)', 'Unpaid Balance')}</div>
                    <div style={{ fontWeight: 700, color: customer.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {formatCurrency(customer.balance, settings.currency, settings.language)}
                    </div>
                  </div>
                </div>
              </div>

              {customer.notes && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderInlineStart: '4px solid var(--primary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.25rem' }}>{t('ملاحظات وإرشادات مهمة', 'Admin Notes')}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{customer.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attendance & Payment Logs Rows */}
        <div className="grid grid-2">
          
          {/* Logs of check-ins */}
          <div className="card">
            <h3 className="card-title mb-2">{t('سجل تسجيل الحضور والدخول مؤخراً', 'Recent Attendance Check-ins')}</h3>
            {attendance.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>{t('لا توجد عمليات حضور مسجلة.', 'No attendance records found.')}</p>
            ) : (
              <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('التاريخ اليومي', 'Date')}</th>
                      <th>{t('توقيت الدخول', 'Time In')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a.id}>
                        <td>{a.date}</td>
                        <td style={{ fontWeight: 600 }}>{new Date(a.checkIn).toLocaleTimeString(settings.language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Logs of payments */}
          <div className="card">
            <h3 className="card-title mb-2">{t('تاريخ عمليات الدفع والتحصيل', 'Payment History')}</h3>
            {payments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>{t('لا توجد فواتير أو دفعات سابقة.', 'No payment logs found.')}</p>
            ) : (
              <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('المبلغ المحصل', 'Amount')}</th>
                      <th>{t('طريقة الدفع', 'Method')}</th>
                      <th>{t('التاريخ', 'Date')}</th>
                      <th>{t('الفاتورة', 'Invoice')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(p.amount, settings.currency, settings.language)}</td>
                        <td>
                          {p.method === 'cash' && t('نقداً', 'Cash')}
                          {p.method === 'card' && t('شبكة / بطاقة', 'Card')}
                          {p.method === 'transfer' && t('تحويل', 'Transfer')}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(p.date).toLocaleDateString(settings.language === 'ar' ? 'ar-EG' : 'en-US')}
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => setInvoiceToPrint(p)}>
                            <FileText size={12} /> {t('فاتورة', 'Invoice')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Renew Subscription */}
        {showRenewModal && (
          <div className="modal-overlay">
            <form className="modal" onSubmit={handleRenewSubmit}>
              <div className="modal-header">
                <h3>{t('تجديد وتمديد اشتراك المشترك', 'Renew Subscription Plan')}</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRenewModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('اختر باقة الاشتراك الجديدة *', 'Select Plan *')}</label>
                  <select className="form-select" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                    {allPlans.map(p => (
                      <option key={p.id} value={p.id}>
                        {settings.language === 'ar' ? p.name : p.nameEn} ({p.price} {settings.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('تاريخ بدء السريان', 'Renewal Start Date')}</label>
                    <input type="date" className="form-input" value={renewStartDate} onChange={(e) => setRenewStartDate(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('الحالة المالية للدفع', 'Payment status')}</label>
                    <select className="form-select" value={renewPaymentStatus} onChange={(e) => setRenewPaymentStatus(e.target.value as any)}>
                      <option value="paid">{t('مدفوعة بالكامل', 'Fully Paid')}</option>
                      <option value="partial">{t('دفعة جزئية / ذمة', 'Partially Paid')}</option>
                      <option value="unpaid">{t('غير مدفوعة', 'Unpaid')}</option>
                    </select>
                  </div>
                </div>

                {renewPaymentStatus === 'partial' && (
                  <div className="form-group animate-fade-in">
                    <label className="form-label">{t('المبلغ المتبقي للتحصيل لاحقاً *', 'Remaining Balance Due *')}</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required 
                      value={renewBalance} 
                      onChange={(e) => setRenewBalance(parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRenewModal(false)}>{t('تراجع', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('تأكيد تجديد الاشتراك', 'Confirm Renewal')}</button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Log Pending Payment */}
        {showPayModal && (
          <div className="modal-overlay">
            <form className="modal" onSubmit={handlePaySubmit}>
              <div className="modal-header">
                <h3>{t('تسجيل تحصيل ذمة مالية معلقة', 'Log Outstanding Payment')}</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPayModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  {t(`المبلغ المتبقي المعلق الكلي: ${customer.balance} ${settings.currency}`, `Total balance due: ${customer.balance} ${settings.currency}`)}
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('المبلغ المدفوع الآن *', 'Amount Paid Now *')}</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required 
                      max={customer.balance}
                      min={1}
                      value={payAmount} 
                      onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('طريقة الدفع', 'Payment Method')}</label>
                    <select className="form-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)}>
                      <option value="cash">{t('نقداً', 'Cash')}</option>
                      <option value="card">{t('بطاقة / شبكة', 'Card')}</option>
                      <option value="transfer">{t('تحويل بنكي', 'Bank Transfer')}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('ملاحظات السداد', 'Notes')}</label>
                  <input type="text" className="form-input" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>{t('تراجع', 'Cancel')}</button>
                <button type="submit" className="btn btn-success">{t('تحصيل المبلغ الكلي / الجزئي', 'Confirm Payment')}</button>
              </div>
            </form>
          </div>
        )}

        {/* Printable Invoice Modal */}
        {invoiceToPrint && (
          <div className="modal-overlay">
            <div className="modal modal-lg">
              <div className="modal-header">
                <h3>{t('معاينة وطباعة الفاتورة', 'Invoice Preview')}</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setInvoiceToPrint(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="invoice-container">
                  <div className="invoice-header">
                    <div>
                      <h2 style={{ color: 'var(--primary)', fontWeight: 800 }}>{settings.businessName}</h2>
                      <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{t('فاتورة تحصيل اشتراك تجاري مالي', 'Official Subscription Invoice')}</p>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>#{invoiceToPrint.id}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {t('تاريخ الفاتورة:', 'Date:')} {new Date(invoiceToPrint.date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>

                  <div className="invoice-details">
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('العميل / المشترك:', 'Billed To:')}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{customer.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{t('جوال:', 'Phone:')} {customer.phone}</div>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('نوع الاشتراك الباقة:', 'Plan Subscribed:')}</div>
                      <div style={{ fontWeight: 'bold' }}>{plan ? (settings.language === 'ar' ? plan.name : plan.nameEn) : ''}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {t('الصلاحية من:', 'Valid from:')} {customer.startDate} {t('إلى', 'to')} {customer.endDate}
                      </div>
                    </div>
                  </div>

                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>{t('الوصف والتفاصيل', 'Description')}</th>
                        <th style={{ textAlign: 'end' }}>{t('المجموع المدفوع', 'Paid Amount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          {t('تجديد / تمديد باقة اشتراك لـ ', 'Subscription package renewal for ')} 
                          {plan ? (settings.language === 'ar' ? plan.name : plan.nameEn) : ''}
                        </td>
                        <td style={{ textAlign: 'end', fontWeight: 'bold' }}>
                          {formatCurrency(invoiceToPrint.amount, settings.currency, settings.language)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="invoice-total">
                    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'flex-end', borderTop: '2px solid #cbd5e1', paddingTop: '0.5rem', width: '250px' }}>
                      <span>{t('المجموع المحصل:', 'Total Paid:')}</span>
                      <span style={{ fontWeight: 800, color: 'green' }}>
                        {formatCurrency(invoiceToPrint.amount, settings.currency, settings.language)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setInvoiceToPrint(null)}>{t('إغلاق', 'Close')}</button>
                <button className="btn btn-primary" onClick={() => window.print()}>{t('طباعة الفاتورة PDF', 'Print / Save PDF')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
