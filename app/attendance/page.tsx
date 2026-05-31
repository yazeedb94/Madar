'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/lib/context';
import { getCustomers, saveCustomer, getAttendance, saveAttendance } from '@/lib/store';
import { getRemainingDays, getSubscriptionStatus, generateId } from '@/lib/utils';
import { Search, UserCheck, AlertOctagon, CheckCircle2, QrCode, Clock } from 'lucide-react';

export default function Attendance() {
  const { settings, businessConfig, t, refreshData } = useApp();

  // Core Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Search & Check-in simulation states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [scanResult, setScanResult] = useState<any>(null); // { success: boolean, message: string, customer: any }

  const loadData = () => {
    setCustomers(getCustomers());
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysLogs = getAttendance()
      .filter(a => a.date === todayStr)
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
      .map(log => {
        const cust = getCustomers().find(c => c.id === log.customerId);
        return {
          ...log,
          customerName: cust ? cust.name : t('مشترك غير معروف', 'Unknown Member'),
          customerPhone: cust ? cust.phone : '',
          customerGender: cust ? cust.gender : 'male'
        };
      });
    
    setLogs(todaysLogs);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search handle for quick input suggestion
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const filtered = customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered.slice(0, 5));
  }, [searchQuery, customers]);

  // Execute Check-in operation
  const handleCheckIn = (customerObj: any) => {
    const remaining = getRemainingDays(customerObj.endDate);
    const subStatus = getSubscriptionStatus(customerObj.endDate);
    const isFrozen = customerObj.notes?.includes('[FREEZE]');

    // Validation Rules
    if (isFrozen) {
      setScanResult({
        success: false,
        message: t('عذراً! هذا الاشتراك مجمد مؤقتاً.', 'Access Denied: Membership is temporarily frozen.'),
        customer: customerObj
      });
      return;
    }

    if (subStatus === 'expired') {
      setScanResult({
        success: false,
        message: t('عذراً! باقة الاشتراك منتهية الصلاحية.', 'Access Denied: Subscription has expired.'),
        customer: customerObj
      });
      return;
    }

    // Success Check-in!
    const newRecord = {
      id: `ATT-${generateId()}`,
      customerId: customerObj.id,
      checkIn: new Date().toISOString(),
      checkOut: null,
      date: new Date().toISOString().split('T')[0],
      sessionNumber: logs.filter(l => l.customerId === customerObj.id).length + 1
    };

    saveAttendance(newRecord);
    
    setScanResult({
      success: true,
      message: t('تم تسجيل الحضور بنجاح. أهلاً بك!', 'Check-in successful! Welcome!'),
      customer: customerObj,
      remaining
    });

    setSearchQuery('');
    loadData();
    refreshData();
  };

  // Simulate scanning a random customer's QR code
  const simulateQRScan = () => {
    if (customers.length === 0) {
      alert(t('الرجاء إضافة مشتركين أولاً لتجربة المحاكي!', 'Please add subscribers first to simulate QR scan!'));
      return;
    }
    // Random select
    const randomIndex = Math.floor(Math.random() * customers.length);
    const randomCustomer = customers[randomIndex];
    handleCheckIn(randomCustomer);
  };

  return (
    <AppShell>
      <div className="page-container animate-fade-in" style={{ maxWidth: '1000px' }}>
        
        {/* Title */}
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }} className="mb-1">
          {settings.language === 'ar' ? businessConfig.checkInLabel.ar : businessConfig.checkInLabel.en}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mb-3">
          {t('امسح كود المشترك للتحقق من الصلاحية، أو ابحث عنه يدوياً لتسجيل الدخول الفوري.', 'Scan member QR code to validate access, or search manually to check in instantly.')}
        </p>

        {/* Check-in panel split */}
        <div className="grid grid-2" style={{ gap: '2rem' }}>
          
          {/* Scanner Simulation Card */}
          <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 className="card-title mb-2">{t('ماسح الكود والتحضير السريع', 'QR Scanner / Access Control')}</h3>
            
            {/* Visual Scanner Camera simulator */}
            <div 
              style={{
                width: '100%',
                maxWidth: '320px',
                aspectRatio: '1',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#0a0a0f',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                margin: '1.5rem auto'
              }}
            >
              {/* Scan laser line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                backgroundColor: 'var(--primary)',
                boxShadow: '0 0 10px var(--primary)',
                animation: 'scannerLaser 2.5s linear infinite'
              }} />
              <style jsx global>{`
                @keyframes scannerLaser {
                  0% { top: 0%; }
                  50% { top: 100%; }
                  100% { top: 0%; }
                }
              `}</style>

              <QrCode size={96} style={{ color: 'var(--border-color)' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
                [ {t('محاكي ماسح QR الذكي', 'QR Scanner Simulator')} ]
              </p>
            </div>

            <button className="btn btn-primary mb-3" onClick={simulateQRScan}>
              <QrCode size={16} /> {t('محاكاة مسح كود QR عشوائي', 'Simulate QR Code Scan')}
            </button>

            {/* Manual check in search input */}
            <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{ textAlign: 'start' }}>{t('أو البحث اليدوي السريع:', 'Or Search & Check-in:')}</label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: settings.language === 'ar' ? '1rem' : 'auto', left: settings.language === 'en' ? '1rem' : 'auto', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingInlineStart: '2.5rem' }}
                    placeholder={t(`اكتب اسم المشترك أو رقم جواله...`, `Type subscriber name or phone...`)}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Auto Suggestions dropdown */}
                {searchResults.length > 0 && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 50,
                      textAlign: 'start',
                      marginTop: '0.25rem',
                      overflow: 'hidden'
                    }}
                  >
                    {searchResults.map(cust => (
                      <div
                        key={cust.id}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background-color 0.2s',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onClick={() => handleCheckIn(cust)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{cust.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cust.phone}</div>
                        </div>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{t('تسجيل دخول', 'Check In')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Validation Result Box */}
          <div className="flex-column gap-2">
            
            {/* Scan output result display */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '300px' }}>
              {scanResult ? (
                <div style={{ textAlign: 'center', padding: '1rem' }} className="animate-fade-in">
                  
                  {/* Icon state */}
                  {scanResult.success ? (
                    <div className="flex-center" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--success-light)', color: 'var(--success)', margin: '0 auto 1rem', fontSize: '2rem' }}>
                      ✓
                    </div>
                  ) : (
                    <div className="flex-center" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', margin: '0 auto 1rem', fontSize: '2rem' }}>
                      ✕
                    </div>
                  )}

                  <h2 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 800, 
                    color: scanResult.success ? 'var(--success)' : 'var(--danger)',
                    marginBottom: '0.5rem' 
                  }}>
                    {scanResult.success ? t('تأكيد حضور مقبل', 'Access Approved') : t('دخول مرفوض!', 'Access Denied')}
                  </h2>

                  <p className="mb-3" style={{ fontWeight: 500 }}>{scanResult.message}</p>

                  {/* Customer Preview Detail */}
                  <div style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    textAlign: 'start',
                    maxWidth: '400px',
                    margin: '0 auto'
                  }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '2.5rem' }}>{scanResult.customer.gender === 'male' ? '👨' : '👩'}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{scanResult.customer.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{scanResult.customer.phone}</div>
                      </div>
                    </div>

                    <div className="grid grid-2" style={{ fontSize: '0.85rem', gap: '0.5rem 1rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>{t('الرقم الكودي:', 'ID:')}</span>{' '}
                        <strong style={{ fontFamily: 'monospace' }}>{scanResult.customer.id}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>{t('حالة الدفع:', 'Payment:')}</span>{' '}
                        <strong>
                          {scanResult.customer.paymentStatus === 'paid' ? t('مسدد بالكامل', 'Paid') : t('عليه مبالغ معلقة', 'Due Balance')}
                        </strong>
                      </div>
                    </div>

                    {scanResult.success && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.5rem',
                        backgroundColor: 'var(--success-light)',
                        color: 'var(--success)',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}>
                        {t(`متبقي في صلاحية الباقة: ${scanResult.remaining} يوم`, `Days remaining: ${scanResult.remaining} days`)}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  <QrCode size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <p>{t('بانتظار مسح كود QR أو إدخال كود يدوياً لعرض نتيجة الصلاحية.', 'Waiting for QR scan or manual input to validate status.')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Daily Check-in list logs */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 className="card-title mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} style={{ color: 'var(--primary)' }} />
            <span>{t('قائمة التحضير والدخول لليوم', 'Today\'s Attendance Activity Logs')}</span>
          </h3>

          {logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1.5rem 0' }}>{t('لا توجد عمليات حضور مسجلة اليوم حتى الآن.', 'No one has checked in today yet.')}</p>
          ) : (
            <div className="table-container" style={{ margin: '1rem 0 0' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('المشترك', 'Subscriber')}</th>
                    <th>{t('الهاتف', 'Phone')}</th>
                    <th>{t('وقت الدخول تسجيل الحضور', 'Time In')}</th>
                    <th>{t('سجل رقم زيارة', 'Visit Session')}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{log.customerGender === 'male' ? '👨' : '👩'}</span>
                          <span style={{ fontWeight: 600 }}>{log.customerName}</span>
                        </div>
                      </td>
                      <td>{log.customerPhone}</td>
                      <td style={{ fontWeight: 600 }}>{new Date(log.checkIn).toLocaleTimeString(settings.language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                      <td>
                        <span className="badge badge-info">{t(`حضور #${log.sessionNumber}`, `Session #${log.sessionNumber}`)}</span>
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
