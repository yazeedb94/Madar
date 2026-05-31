'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/lib/context';
import { getPlans, savePlan, deletePlan } from '@/lib/store';
import { Shield, Plus, Edit3, Trash2, CheckCircle2, XCircle } from 'lucide-react';

export default function Subscriptions() {
  const { settings, businessConfig, t } = useApp();

  // Core Data States
  const [plans, setPlans] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [duration, setDuration] = useState(1);
  const [durationType, setDurationType] = useState<'days' | 'months' | 'years'>('months');
  const [price, setPrice] = useState(100);
  const [sessionCount, setSessionCount] = useState(0);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadPlans = () => {
    setPlans(getPlans());
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nameEn) {
      alert(t('يرجى كتابة اسم الباقة بالعربية والإنجليزية!', 'Please input plan name in both Arabic and English!'));
      return;
    }

    const newPlan = {
      id: `PLAN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      name,
      nameEn,
      duration,
      durationType,
      price,
      sessionCount: businessConfig.hasSessionCount ? sessionCount : 0,
      description,
      isActive: true
    };

    savePlan(newPlan);
    resetForm();
    setShowAddModal(false);
    loadPlans();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const updated = {
      ...selectedPlan,
      name,
      nameEn,
      duration,
      durationType,
      price,
      sessionCount: businessConfig.hasSessionCount ? sessionCount : 0,
      description,
      isActive
    };

    savePlan(updated);
    setShowEditModal(false);
    loadPlans();
  };

  const handleDeletePlan = (id: string) => {
    if (confirm(t('هل أنت متأكد من حذف هذه الباقة؟ قد تؤثر على المشتركين الحاليين.', 'Are you sure you want to delete this plan? This may affect existing subscribers.'))) {
      deletePlan(id);
      loadPlans();
    }
  };

  const openEdit = (plan: any) => {
    setSelectedPlan(plan);
    setName(plan.name);
    setNameEn(plan.nameEn);
    setDuration(plan.duration);
    setDurationType(plan.durationType);
    setPrice(plan.price);
    setSessionCount(plan.sessionCount || 0);
    setDescription(plan.description || '');
    setIsActive(plan.isActive);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setName('');
    setNameEn('');
    setDuration(1);
    setDurationType('months');
    setPrice(100);
    setSessionCount(0);
    setDescription('');
    setIsActive(true);
  };

  return (
    <AppShell>
      <div className="page-container animate-fade-in">
        
        {/* Page Title */}
        <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {settings.language === 'ar' ? businessConfig.plansLabel.ar : businessConfig.plansLabel.en}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t(`إدارة الباقات والاشتراكات المتاحة، تحديد المدة، الأسعار، وعدد الجلسات المسموحة.`, `Manage membership plans, durations, prices, and allowed session counts.`)}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} /> {t('إنشاء باقة جديدة', 'Create New Plan')}
          </button>
        </div>

        {/* Plan Cards Grid */}
        {plans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛡️</div>
            <div className="empty-state-text">{t('لم يتم إنشاء أي باقة بعد.', 'No subscription plans created yet.')}</div>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> {t('إنشاء باقة الآن', 'Create Plan Now')}
            </button>
          </div>
        ) : (
          <div className="grid grid-3">
            {plans.map(p => (
              <div 
                key={p.id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${p.isActive ? 'var(--primary)' : 'var(--text-muted)'}`,
                  opacity: p.isActive ? 1 : 0.7
                }}
              >
                <div>
                  <div className="flex-between mb-1">
                    <span className="badge badge-info">{p.id}</span>
                    <span className={`badge ${p.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {p.isActive ? t('نشط ومتاح', 'Active') : t('غير نشط', 'Inactive')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.5rem' }}>
                    {settings.language === 'ar' ? p.name : p.nameEn}
                  </h3>

                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '1rem 0' }}>
                    {p.price} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>{settings.currency}</span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
                      <span>
                        {t('المدة: ', 'Duration: ')} {p.duration} {
                          p.durationType === 'days' && t('أيام', 'days')
                        } {
                          p.durationType === 'months' && t('أشهر', 'months')
                        } {
                          p.durationType === 'years' && t('سنوات', 'years')
                        }
                      </span>
                    </li>
                    {businessConfig.hasSessionCount && (
                      <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
                        <span>
                          {t('عدد الجلسات: ', 'Sessions: ')} {p.sessionCount > 0 ? p.sessionCount : t('مفتوح', 'Unlimited')}
                        </span>
                      </li>
                    )}
                    {p.description && (
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.description}</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-2" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(p)}>
                    <Edit3 size={14} /> {t('تعديل', 'Edit')}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeletePlan(p.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add Plan */}
        {showAddModal && (
          <div className="modal-overlay">
            <form className="modal" onSubmit={handleAddSubmit}>
              <div className="modal-header">
                <h3>{t('إنشاء باقة اشتراك جديدة', 'Create New Plan')}</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('اسم الباقة (بالعربية) *', 'Plan Name (Arabic) *')}</label>
                  <input type="text" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: الاشتراك الشهري العام" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('اسم الباقة (بالإنجليزية) *', 'Plan Name (English) *')}</label>
                  <input type="text" className="form-input" required value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Basic Monthly Plan" />
                </div>

                <div className="grid grid-3">
                  <div className="form-group">
                    <label className="form-label">{t('المدة *', 'Duration *')}</label>
                    <input type="number" className="form-input" required min={1} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('نوع المدة *', 'Duration Unit *')}</label>
                    <select className="form-select" value={durationType} onChange={(e) => setDurationType(e.target.value as any)}>
                      <option value="days">{t('أيام', 'Days')}</option>
                      <option value="months">{t('أشهر', 'Months')}</option>
                      <option value="years">{t('سنوات', 'Years')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('السعر *', 'Price *')}</label>
                    <input type="number" className="form-input" required min={0} value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>

                {businessConfig.hasSessionCount && (
                  <div className="form-group animate-fade-in">
                    <label className="form-label">{t('عدد الجلسات (0 تعني دخول غير محدود) *', 'Allowed Sessions (0 = Unlimited) *')}</label>
                    <input type="number" className="form-input" required min={0} value={sessionCount} onChange={(e) => setSessionCount(parseInt(e.target.value) || 0)} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t('الوصف ومزايا الباقة', 'Description')}</label>
                  <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>{t('إلغاء', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('حفظ الباقة', 'Save Plan')}</button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Edit Plan */}
        {showEditModal && (
          <div className="modal-overlay">
            <form className="modal" onSubmit={handleEditSubmit}>
              <div className="modal-header">
                <h3>{t('تعديل باقة الاشتراك', 'Edit Plan')}</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t('اسم الباقة (بالعربية) *', 'Plan Name (Arabic) *')}</label>
                  <input type="text" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('اسم الباقة (بالإنجليزية) *', 'Plan Name (English) *')}</label>
                  <input type="text" className="form-input" required value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
                </div>

                <div className="grid grid-3">
                  <div className="form-group">
                    <label className="form-label">{t('المدة *', 'Duration *')}</label>
                    <input type="number" className="form-input" required min={1} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('نوع المدة *', 'Duration Unit *')}</label>
                    <select className="form-select" value={durationType} onChange={(e) => setDurationType(e.target.value as any)}>
                      <option value="days">{t('أيام', 'Days')}</option>
                      <option value="months">{t('أشهر', 'Months')}</option>
                      <option value="years">{t('سنوات', 'Years')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('السعر *', 'Price *')}</label>
                    <input type="number" className="form-input" required min={0} value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>

                {businessConfig.hasSessionCount && (
                  <div className="form-group animate-fade-in">
                    <label className="form-label">{t('عدد الجلسات (0 تعني دخول غير محدود) *', 'Allowed Sessions (0 = Unlimited) *')}</label>
                    <input type="number" className="form-input" required min={0} value={sessionCount} onChange={(e) => setSessionCount(parseInt(e.target.value) || 0)} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t('الوصف ومزايا الباقة', 'Description')}</label>
                  <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                    <span>{t('الباقة نشطة ومتاحة للاشتراك حالياً', 'This plan is active and currently available')}</span>
                  </label>
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
