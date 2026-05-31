'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/lib/context';
import { getCustomers, saveCustomer, deleteCustomer, getPlans, savePayment, pushNotification, getNotifications } from '@/lib/store';
import { getRemainingDays, getSubscriptionStatus, formatCurrency, generateId } from '@/lib/utils';
import { Search, Plus, Upload, Trash2, Edit3, Eye, Calendar, DollarSign, UserCheck } from 'lucide-react';
import Link from 'next/link';

function CustomersContent() {
  const { settings, businessConfig, t, refreshData } = useApp();
  const searchParams = useSearchParams();

  // Core Data States
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Form Field States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [balance, setBalance] = useState(0);
  const [notes, setNotes] = useState('');

  // Load Initial Data + auto-generate notifications based on customer states
  const loadData = () => {
    const list = getCustomers();
    const activePlans = getPlans().filter(p => p.isActive);
    setCustomers(list);
    setPlans(activePlans);

    if (activePlans.length > 0) {
      setPlanId(activePlans[0].id);
    }

    // Auto-generate subscription alerts
    list.forEach((c: any) => {
      const remaining = getRemainingDays(c.endDate);
      if (c.status === 'frozen') return; // Don't alert frozen members

      if (remaining < 0) {
        pushNotification({
          type: 'expired',
          title: `انتهى اشتراك ${c.name}`,
          message: `اشتراك العضو ${c.name} انتهى منذ ${Math.abs(remaining)} يوم. يرجى التواصل معه للتجديد.`,
          customerId: c.id,
        });
      } else if (remaining <= 5) {
        pushNotification({
          type: 'expiring',
          title: `اشتراك ${c.name} على وشك الانتهاء`,
          message: `ينتهي اشتراك العضو ${c.name} خلال ${remaining} أيام بتاريخ ${c.endDate}.`,
          customerId: c.id,
        });
      }

      if (c.paymentStatus === 'unpaid' || c.paymentStatus === 'partial') {
        pushNotification({
          type: 'payment',
          title: `ذمة مالية معلقة - ${c.name}`,
          message: `لدى العضو ${c.name} مبلغ متأخر بقيمة ${c.balance} غير مسدد.`,
          customerId: c.id,
        });
      }
    });
  };

  useEffect(() => {
    loadData();
    
    // Check if redirecting from dashboard with add=true
    if (searchParams.get('add') === 'true') {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setShowAddModal(true);
    }
  }, [searchParams]);

  // Handle Add Customer Form Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert(t('الرجاء إدخال الاسم ورقم الهاتف!', 'Please enter name and phone number!'));
      return;
    }

    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) return;

    // Calculate End Date
    const start = new Date(startDate);
    const end = new Date(startDate);
    if (selectedPlan.durationType === 'days') {
      end.setDate(start.getDate() + selectedPlan.duration);
    } else if (selectedPlan.durationType === 'months') {
      end.setMonth(start.getMonth() + selectedPlan.duration);
    } else {
      end.setFullYear(start.getFullYear() + selectedPlan.duration);
    }

    const newId = `CUST-${generateId()}`;
    const newCustomer = {
      id: newId,
      name,
      phone,
      email,
      gender,
      planId,
      startDate,
      endDate: end.toISOString().split('T')[0],
      paymentStatus,
      balance: paymentStatus === 'unpaid' ? selectedPlan.price : paymentStatus === 'partial' ? balance : 0,
      notes,
      qrCode: newId,
      createdAt: new Date().toISOString()
    };

    saveCustomer(newCustomer);

    // Save corresponding payment transaction
    if (paymentStatus !== 'unpaid') {
      const amountPaid = paymentStatus === 'paid' ? selectedPlan.price : (selectedPlan.price - balance);
      savePayment({
        id: `PAY-${generateId()}`,
        customerId: newId,
        amount: amountPaid,
        date: new Date().toISOString(),
        method: 'cash',
        status: 'completed',
        notes: t('دفعة أولى عند التسجيل', 'Registration payment')
      });
    }

    // Welcome notification for new member
    pushNotification({
      type: 'welcome',
      title: `عضو جديد: ${name}`,
      message: `تم تسجيل العضو ${name} بنجاح في باقة "${selectedPlan.name}" ابتداءً من ${startDate}.`,
      customerId: newId,
    });

    // If unpaid, push payment alert immediately
    if (paymentStatus === 'unpaid' || paymentStatus === 'partial') {
      const bal = paymentStatus === 'unpaid' ? selectedPlan.price : balance;
      pushNotification({
        type: 'payment',
        title: `ذمة مالية معلقة - ${name}`,
        message: `لدى العضو ${name} مبلغ متأخر بقيمة ${bal} غير مسدد.`,
        customerId: newId,
      });
    }

    resetForm();
    setShowAddModal(false);
    loadData();
    refreshData();
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) return;

    // Calculate End Date if plan or start date changed
    let finalEndDate = selectedCustomer.endDate;
    if (selectedCustomer.planId !== planId || selectedCustomer.startDate !== startDate) {
      const start = new Date(startDate);
      const end = new Date(startDate);
      if (selectedPlan.durationType === 'days') {
        end.setDate(start.getDate() + selectedPlan.duration);
      } else if (selectedPlan.durationType === 'months') {
        end.setMonth(start.getMonth() + selectedPlan.duration);
      } else {
        end.setFullYear(start.getFullYear() + selectedPlan.duration);
      }
      finalEndDate = end.toISOString().split('T')[0];
    }

    const updated = {
      ...selectedCustomer,
      name,
      phone,
      email,
      gender,
      planId,
      startDate,
      endDate: finalEndDate,
      paymentStatus,
      balance: paymentStatus === 'unpaid' ? selectedPlan.price : paymentStatus === 'partial' ? balance : 0,
      notes
    };

    saveCustomer(updated);
    setShowEditModal(false);
    loadData();
    refreshData();
  };

  // Delete customer handler
  const handleDelete = (id: string) => {
    if (confirm(t('هل أنت متأكد من حذف هذا المشترك نهائياً وكل سجلاته؟', 'Are you sure you want to permanently delete this member and all their records?'))) {
      deleteCustomer(id);
      loadData();
      refreshData();
    }
  };

  const openEdit = (cust: any) => {
    setSelectedCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone);
    setEmail(cust.email || '');
    setGender(cust.gender);
    setPlanId(cust.planId);
    setStartDate(cust.startDate);
    setPaymentStatus(cust.paymentStatus);
    setBalance(cust.balance || 0);
    setNotes(cust.notes || '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setGender('male');
    if (plans.length > 0) setPlanId(plans[0].id);
    setStartDate(new Date().toISOString().split('T')[0]);
    setPaymentStatus('paid');
    setBalance(0);
    setNotes('');
  };

  // Filter and Search logic
  const filteredCustomers = customers.filter(c => {
    // Search filter
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const isFrozen = c.notes?.includes('[FREEZE]');
    const status = isFrozen ? 'frozen' : getSubscriptionStatus(c.endDate);
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && status === 'active') ||
      (statusFilter === 'frozen' && status === 'frozen') ||
      (statusFilter === 'expiring' && status === 'expiring') ||
      (statusFilter === 'expired' && status === 'expired');

    // Payment filter
    const matchesPayment = 
      paymentFilter === 'all' || 
      c.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <AppShell>
      <div className="page-container animate-fade-in">
        {/* Header Section */}
        <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {settings.language === 'ar' ? businessConfig.membersLabel.ar : businessConfig.membersLabel.en}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t(`عرض قائمة ${businessConfig.membersLabel.ar}، إدارة حساباتهم وتفاصيل اشتراكاتهم.`, `View list of ${businessConfig.membersLabel.en}, manage accounts and plan details.`)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/customers/import">
              <button className="btn btn-secondary">
                <Upload size={16} /> {t('استيراد من Excel', 'Excel Import')}
              </button>
            </Link>
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
              <Plus size={16} /> {t(`إضافة ${businessConfig.memberLabel.ar}`, `Add ${businessConfig.memberLabel.en}`)}
            </button>
          </div>
        </div>

        {/* Filters and Search toolbar */}
        <div className="search-container">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={t(`البحث بالاسم، الرقم، أو الكود...`, `Search by name, phone or code...`)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{t('جميع حالات الاشتراكات', 'All Subscription Statuses')}</option>
              <option value="active">{t('النشطة فقط', 'Active Only')}</option>
              <option value="frozen">{t('المجمدة فقط', 'Frozen Only')}</option>
              <option value="expiring">{t('تنتهي قريباً', 'Expiring Soon')}</option>
              <option value="expired">{t('المنتهية فقط', 'Expired Only')}</option>
            </select>

            <select className="form-select" style={{ width: 'auto' }} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">{t('جميع حالات الدفع', 'All Payment Statuses')}</option>
              <option value="paid">{t('مدفوعة بالكامل', 'Fully Paid')}</option>
              <option value="partial">{t('مدفوعة جزئياً', 'Partially Paid')}</option>
              <option value="unpaid">{t('غير مدفوعة', 'Unpaid')}</option>
            </select>
          </div>
        </div>

        {/* Customers Table */}
        {filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-text">
              {t(`لا يوجد ${businessConfig.membersLabel.ar} مطابقين للبحث.`, `No matching ${businessConfig.membersLabel.en} found.`)}
            </div>
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
              <Plus size={16} /> {t(`إضافة ${businessConfig.memberLabel.ar} جديد`, `Add New ${businessConfig.memberLabel.en}`)}
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('الكود', 'Code')}</th>
                  <th>{t('الاسم الكامل', 'Name')}</th>
                  <th>{t('رقم الهاتف', 'Phone')}</th>
                  <th>{t('الباقة الحالية', 'Plan')}</th>
                  <th>{t('انتهاء الاشتراك', 'Expires')}</th>
                  <th>{t('حالة الاشتراك', 'Sub Status')}</th>
                  <th>{t('حالة الدفع', 'Payment Status')}</th>
                  <th>{t('الإجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(cust => {
                  const plan = plans.find(p => p.id === cust.planId);
                  const subStatus = getSubscriptionStatus(cust.endDate);
                  const remaining = getRemainingDays(cust.endDate);

                  return (
                    <tr key={cust.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cust.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.25rem' }}>{cust.gender === 'male' ? '👨' : '👩'}</span>
                          <span style={{ fontWeight: 600 }}>{cust.name}</span>
                        </div>
                      </td>
                      <td>{cust.phone}</td>
                      <td>{plan ? (settings.language === 'ar' ? plan.name : plan.nameEn) : t('باقة غير معروفة', 'Unknown')}</td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{cust.endDate}</span>
                      </td>
                      <td>
                        {cust.notes?.includes('[FREEZE]') ? (
                          <span className="badge badge-warning">
                            {t('مجمد مؤقتاً', 'Frozen')}
                          </span>
                        ) : (
                          <>
                            {subStatus === 'active' && (
                              <span className="badge badge-success">
                                {t(`نشط (${remaining} يوم)`, `Active (${remaining}d)`)}
                              </span>
                            )}
                            {subStatus === 'expiring' && (
                              <span className="badge badge-warning">
                                {t(`ينتهي قريباً (${remaining} يوم)`, `Ending soon (${remaining}d)`)}
                              </span>
                            )}
                            {subStatus === 'expired' && (
                              <span className="badge badge-danger">
                                {t('منتهي الصلاحية', 'Expired')}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td>
                        {cust.paymentStatus === 'paid' && <span className="badge badge-success">{t('مدفوع كامل', 'Paid')}</span>}
                        {cust.paymentStatus === 'partial' && (
                          <span className="badge badge-warning">
                            {t(`متبقي ${cust.balance} ${settings.currency}`, `Due: ${cust.balance} ${settings.currency}`)}
                          </span>
                        )}
                        {cust.paymentStatus === 'unpaid' && (
                          <span className="badge badge-danger">
                            {t(`غير مدفوع (${cust.balance})`, `Unpaid (${cust.balance})`)}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <Link href={`/customers/${cust.id}`}>
                            <button className="btn btn-secondary btn-sm" title={t('عرض الملف الشخصي', 'View Profile')}>
                              <Eye size={14} />
                            </button>
                          </Link>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cust)} title={t('تعديل البيانات', 'Edit Profile')}>
                            <Edit3 size={14} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cust.id)} title={t('حذف المشترك', 'Delete Member')}>
                            <Trash2 size={14} />
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

        {/* Add Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <form className="modal" onSubmit={handleAddSubmit}>
              <div className="modal-header">
                <h3>{t(`إضافة ${businessConfig.memberLabel.ar} جديد`, `Add New ${businessConfig.memberLabel.en}`)}</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('الاسم الكامل *', 'Full Name *')}</label>
                  <input type="text" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('رقم الهاتف *', 'Phone *')}</label>
                    <input type="tel" className="form-input" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('البريد الإلكتروني', 'Email')}</label>
                    <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('الجنس', 'Gender')}</label>
                    <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')}>
                      <option value="male">{t('ذكر', 'Male')}</option>
                      <option value="female">{t('أنثى', 'Female')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t(`الباقة المختارة`, `Select ${businessConfig.planLabel.en}`)}</label>
                    <select className="form-select" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>
                          {settings.language === 'ar' ? p.name : p.nameEn} ({p.price} {settings.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('تاريخ بدء الاشتراك', 'Start Date')}</label>
                    <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('حالة الدفع المالية', 'Payment Status')}</label>
                    <select className="form-select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)}>
                      <option value="paid">{t('مدفوعة بالكامل', 'Fully Paid')}</option>
                      <option value="partial">{t('دفعة جزئية / متبقي', 'Partially Paid / Due')}</option>
                      <option value="unpaid">{t('غير مدفوع', 'Unpaid')}</option>
                    </select>
                  </div>
                </div>
                
                {paymentStatus === 'partial' && (
                  <div className="form-group animate-fade-in">
                    <label className="form-label">{t('المبلغ المتبقي المعلق (الذمة) *', 'Remaining Balance Due *')}</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required 
                      value={balance} 
                      onChange={(e) => setBalance(parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t('ملاحظات خاصة', 'Notes')}</label>
                  <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>{t('إلغاء', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('حفظ المشترك', 'Save Member')}</button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <form className="modal" onSubmit={handleEditSubmit}>
              <div className="modal-header">
                <h3>{t(`تعديل بيانات ${businessConfig.memberLabel.ar}`, `Edit ${businessConfig.memberLabel.en}`)}</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('الاسم الكامل *', 'Full Name *')}</label>
                  <input type="text" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('رقم الهاتف *', 'Phone *')}</label>
                    <input type="tel" className="form-input" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('البريد الإلكتروني', 'Email')}</label>
                    <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('الجنس', 'Gender')}</label>
                    <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')}>
                      <option value="male">{t('ذكر', 'Male')}</option>
                      <option value="female">{t('أنثى', 'Female')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t(`الباقة الحالية`, `Plan`)}</label>
                    <select className="form-select" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>
                          {settings.language === 'ar' ? p.name : p.nameEn} ({p.price} {settings.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">{t('تاريخ بدء الاشتراك', 'Start Date')}</label>
                    <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('حالة الدفع المالية', 'Payment Status')}</label>
                    <select className="form-select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)}>
                      <option value="paid">{t('مدفوعة بالكامل', 'Fully Paid')}</option>
                      <option value="partial">{t('دفعة جزئية / متبقي', 'Partially Paid / Due')}</option>
                      <option value="unpaid">{t('غير مدفوع', 'Unpaid')}</option>
                    </select>
                  </div>
                </div>

                {paymentStatus === 'partial' && (
                  <div className="form-group animate-fade-in">
                    <label className="form-label">{t('المبلغ المتبقي المعلق (الذمة) *', 'Remaining Balance Due *')}</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required 
                      value={balance} 
                      onChange={(e) => setBalance(parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t('ملاحظات خاصة', 'Notes')}</label>
                  <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>{t('إلغاء', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('حفظ التعديلات', 'Save Changes')}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function Customers() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="page-container flex-center" style={{ minHeight: '50vh' }}>
          <p>جاري تحميل قائمة العملاء...</p>
        </div>
      </AppShell>
    }>
      <CustomersContent />
    </Suspense>
  );
}
