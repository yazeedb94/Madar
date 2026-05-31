'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/lib/context';
import { getNotifications, getCustomers, markNotificationRead, saveNotifications, deduplicateNotifications } from '@/lib/store';
import { Bell, Check, MessageCircle, AlertTriangle, UserCheck, Trash2 } from 'lucide-react';

export default function Notifications() {
  const { settings, t, refreshData, triggerCount } = useApp();

  // States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [whatsappTemplate, setWhatsappTemplate] = useState({
    show: false,
    text: '',
    phone: '',
    customerName: ''
  });

  const loadData = () => {
    const allNotifs = getNotifications().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const allCusts = getCustomers();
    setNotifications(allNotifs);
    setCustomers(allCusts);
  };

  useEffect(() => {
    // Clean up any pre-existing duplicates on first mount
    deduplicateNotifications();
    loadData();
  }, [triggerCount]);

  const handleMarkAsRead = (id: string) => {
    markNotificationRead(id);
    loadData();
    refreshData();
  };

  const handleMarkAllRead = () => {
    const list = getNotifications().map(n => ({ ...n, read: true }));
    saveNotifications(list);
    loadData();
    refreshData();
  };

  const handleDeleteNotif = (id: string) => {
    const list = getNotifications().filter(n => n.id !== id);
    saveNotifications(list);
    loadData();
    refreshData();
  };

  // Open WhatsApp Dialog with populated template
  const openWhatsAppDialog = (notif: any) => {
    const cust = customers.find(c => c.id === notif.customerId);
    if (!cust) return;

    let text = '';
    if (notif.type === 'expiring') {
      text = t(
        `مرحباً كابتن ${cust.name}، نود تذكيرك بأن اشتراكك الحالي سينتهي قريباً بتاريخ ${cust.endDate}. يسعدنا تجديد اشتراكك لتجنب انقطاع الخدمة. شكراً لك!`,
        `Hello ${cust.name}, we would like to remind you that your subscription is ending soon on ${cust.endDate}. Please renew your plan to avoid service interruption.`
      );
    } else if (notif.type === 'expired') {
      text = t(
        `مرحباً كابتن ${cust.name}، نود إحاطتك علماً بأن باقة اشتراكك قد انتهت صلاحيتها. يرجى زيارة الاستقبال لتجديد الاشتراك ومواصلة الحضور. بانتظارك!`,
        `Hello ${cust.name}, your subscription has expired. Please visit the front desk to renew your membership and continue check-ins. We look forward to seeing you!`
      );
    } else if (notif.type === 'payment') {
      text = t(
        `مرحباً كابتن ${cust.name}، نود تذكيرك بوجود ذمة مالية معلقة متبقية بقيمة ${cust.balance} ${settings.currency} على باقتك الحالية. نرجو تسويتها في أقرب وقت. شكراً لك!`,
        `Hello ${cust.name}, this is a gentle reminder that you have an outstanding balance of ${cust.balance} ${settings.currency} on your current plan. Please settle it soon. Thank you!`
      );
    } else {
      text = t(
        `مرحباً كابتن ${cust.name}، يسعدنا تواصلك معنا ونأمل أن تكون راضياً عن خدماتنا!`,
        `Hello ${cust.name}, thank you for choosing us!`
      );
    }

    setWhatsappTemplate({
      show: true,
      text,
      phone: cust.phone,
      customerName: cust.name
    });
  };

  // Open WhatsApp Web with text encoded
  const sendWhatsApp = () => {
    let cleanPhone = whatsappTemplate.phone;
    // Format Middle East numbers if needed (e.g. 05... -> 9665...)
    if (cleanPhone.startsWith('05') && cleanPhone.length === 10) {
      cleanPhone = `966${cleanPhone.substring(1)}`;
    } else if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
      // Egypt (010... -> 2010...)
      cleanPhone = `20${cleanPhone.substring(1)}`;
    }
    
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappTemplate.text)}`;
    window.open(url, '_blank');
    setWhatsappTemplate(prev => ({ ...prev, show: false }));
  };

  return (
    <AppShell>
      <div className="page-container animate-fade-in" style={{ maxWidth: '800px' }}>
        
        {/* Title */}
        <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('مركز التنبيهات وإرسال التذكيرات', 'Alerts & Reminder Center')}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('تنبيهات النظام التلقائية لاقتراب انتهاء صلاحية الباقات، ومطالبات السداد المتأخر.', 'Automated system warnings for plan expirations and outstanding balance notifications.')}
            </p>
          </div>
          {notifications.length > 0 && (
            <button className="btn btn-secondary" onClick={handleMarkAllRead}>
              <Check size={16} /> {t('تحديد الكل كمقروء', 'Mark all as read')}
            </button>
          )}
        </div>

        {/* List of notifications */}
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <div className="empty-state-text">{t('لا توجد أي تنبيهات حالياً.', 'No notifications at this time.')}</div>
          </div>
        ) : (
          <div className="flex-column" style={{ gap: '1rem' }}>
            {notifications.map(notif => (
              <div 
                key={notif.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderInlineStart: `4px solid ${
                    notif.type === 'expired' ? 'var(--danger)' : 
                    notif.type === 'expiring' ? 'var(--warning)' : 
                    notif.type === 'payment' ? 'var(--warning)' : 'var(--primary)'
                  }`,
                  borderRadius: 'var(--radius-md)',
                  opacity: notif.read ? 0.65 : 1,
                  transition: 'opacity 0.2s',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ marginTop: '0.2rem' }}>
                    {notif.type === 'expired' && <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />}
                    {notif.type === 'expiring' && <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />}
                    {notif.type === 'payment' && <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />}
                    {notif.type === 'welcome' && <UserCheck size={18} style={{ color: 'var(--success)' }} />}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 'bold', fontSize: '0.95rem' }} className="mb-05">{notif.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} className="mb-1">{notif.message}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(notif.createdAt).toLocaleString(settings.language === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1" style={{ alignSelf: 'center' }}>
                  {notif.customerId && (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => openWhatsAppDialog(notif)}
                      title={t('تذكير عبر واتساب', 'Send WhatsApp Reminder')}
                      style={{ color: 'var(--success)' }}
                    >
                      <MessageCircle size={14} />
                      <span style={{ display: 'none' }}>واتساب</span>
                    </button>
                  )}
                  {!notif.read && (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleMarkAsRead(notif.id)}
                      title={t('تحديد كمقروء', 'Mark as read')}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDeleteNotif(notif.id)}
                    title={t('حذف التنبيه', 'Delete')}
                  >
                    <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WhatsApp template dialog popup */}
        {whatsappTemplate.show && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{t('إرسال تذكير مباشر للمشترك عبر واتساب', 'Send WhatsApp Reminder')}</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setWhatsappTemplate(prev => ({ ...prev, show: false }))}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {t('المشترك المستلم: ', 'Recipient: ')} <strong>{whatsappTemplate.customerName}</strong> ({whatsappTemplate.phone})
                </div>
                <div className="form-group">
                  <label className="form-label">{t('نص الرسالة التذكيرية القابل للتعديل:', 'Edit Reminder Message:')}</label>
                  <textarea 
                    className="form-textarea" 
                    value={whatsappTemplate.text} 
                    onChange={(e) => setWhatsappTemplate(prev => ({ ...prev, text: e.target.value }))}
                    style={{ minHeight: '130px' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setWhatsappTemplate(prev => ({ ...prev, show: false }))}>{t('إلغاء', 'Cancel')}</button>
                <button className="btn btn-success" onClick={sendWhatsApp}>
                  <MessageCircle size={16} /> {t('إرسال عبر WhatsApp Web', 'Send via WhatsApp')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
