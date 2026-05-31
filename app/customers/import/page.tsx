'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/lib/context';
import { getPlans, getCustomers, saveCustomer, savePayment } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { Upload, FileSpreadsheet, Check, AlertCircle, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExcelImport() {
  const { settings, businessConfig, t, refreshData } = useApp();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  
  // Mapping Config
  const [mapping, setMapping] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '',
    plan: '',
    startDate: '',
    paymentStatus: ''
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Preview/Validate, 4: Done

  // Handle Drag/Drop or Select File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];

        if (data.length === 0) {
          alert(t('الملف فارغ!', 'The file is empty!'));
          setLoading(false);
          return;
        }

        // The first row is headers
        const headers = (data[0] || []) as string[];
        setColumns(headers);

        // Map rest of the rows
        const rows = data.slice(1).map(row => {
          const rowObj: any = {};
          headers.forEach((h, idx) => {
            rowObj[h] = row[idx] !== undefined ? row[idx] : '';
          });
          return rowObj;
        });

        setParsedData(rows);

        // Auto Map Headers Guessing
        const guessedMapping = { ...mapping };
        headers.forEach(h => {
          const headerLower = h.toLowerCase().trim();
          if (headerLower.includes('name') || headerLower.includes('الاسم') || headerLower.includes('اسم')) {
            guessedMapping.name = h;
          } else if (headerLower.includes('phone') || headerLower.includes('هاتف') || headerLower.includes('رقم') || headerLower.includes('جوال')) {
            guessedMapping.phone = h;
          } else if (headerLower.includes('email') || headerLower.includes('بريد') || headerLower.includes('ايميل')) {
            guessedMapping.email = h;
          } else if (headerLower.includes('gender') || headerLower.includes('جنس') || headerLower.includes('نوع')) {
            guessedMapping.gender = h;
          } else if (headerLower.includes('plan') || headerLower.includes('اشتراك') || headerLower.includes('باقة') || headerLower.includes('خطة')) {
            guessedMapping.plan = h;
          } else if (headerLower.includes('date') || headerLower.includes('تاريخ') || headerLower.includes('بدء')) {
            guessedMapping.startDate = h;
          } else if (headerLower.includes('status') || headerLower.includes('دفع') || headerLower.includes('حالة')) {
            guessedMapping.paymentStatus = h;
          }
        });

        setMapping(guessedMapping);
        setStep(2);
      } catch (err) {
        console.error(err);
        alert(t('حدث خطأ أثناء قراءة الملف. تأكد أنه ملف Excel أو CSV صالح.', 'Error reading file. Ensure it is a valid Excel or CSV.'));
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMapChange = (key: keyof typeof mapping, value: string) => {
    setMapping(prev => ({ ...prev, [key]: value }));
  };

  // Run Validations on Mapped Data
  const runValidation = () => {
    if (!mapping.name || !mapping.phone) {
      alert(t('يجب تعيين حقل الاسم ورقم الهاتف على الأقل لمتابعة الاستيراد.', 'You must map at least the Name and Phone fields.'));
      return;
    }

    const errors: string[] = [];
    const phoneSet = new Set();
    const existingCustomers = getCustomers();
    const existingPhones = new Set(existingCustomers.map(c => c.phone));

    parsedData.forEach((row, idx) => {
      const nameVal = row[mapping.name]?.toString().trim();
      const phoneVal = row[mapping.phone]?.toString().trim();

      if (!nameVal) {
        errors.push(t(`السطر ${idx + 2}: الاسم مفقود أو فارغ.`, `Row ${idx + 2}: Name is missing or empty.`));
      }
      if (!phoneVal) {
        errors.push(t(`السطر ${idx + 2}: رقم الهاتف مفقود.`, `Row ${idx + 2}: Phone is missing.`));
      } else {
        if (phoneSet.has(phoneVal)) {
          errors.push(t(`السطر ${idx + 2}: رقم الهاتف مكرر في الملف (${phoneVal}).`, `Row ${idx + 2}: Duplicate phone in file (${phoneVal}).`));
        }
        if (existingPhones.has(phoneVal)) {
          errors.push(t(`السطر ${idx + 2}: رقم الهاتف مسجل بالفعل في النظام (${phoneVal}).`, `Row ${idx + 2}: Phone already registered in system (${phoneVal}).`));
        }
        phoneSet.add(phoneVal);
      }
    });

    setValidationErrors(errors);
    setStep(3);
  };

  // Save parsed data to localStorage
  const executeImport = () => {
    setLoading(true);
    const logs: string[] = [];
    const plans = getPlans();
    const defaultPlan = plans[0] || { id: 'p1', duration: 1, durationType: 'months', price: 100 };

    let successCount = 0;

    parsedData.forEach((row) => {
      const nameVal = row[mapping.name]?.toString().trim();
      const phoneVal = row[mapping.phone]?.toString().trim();
      const emailVal = row[mapping.email]?.toString().trim() || '';
      const genderValRaw = row[mapping.gender]?.toString().trim().toLowerCase() || 'male';
      const genderVal = (genderValRaw.includes('f') || genderValRaw.includes('female') || genderValRaw.includes('انثى') || genderValRaw.includes('بنت')) ? 'female' : 'male';
      const planNameVal = row[mapping.plan]?.toString().trim();
      const startDateValRaw = row[mapping.startDate]?.toString().trim();
      const paymentStatusValRaw = row[mapping.paymentStatus]?.toString().trim().toLowerCase() || 'paid';
      
      let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'paid';
      if (paymentStatusValRaw.includes('unpaid') || paymentStatusValRaw.includes('غير') || paymentStatusValRaw.includes('معلق')) {
        paymentStatus = 'unpaid';
      } else if (paymentStatusValRaw.includes('part') || paymentStatusValRaw.includes('جزئ')) {
        paymentStatus = 'partial';
      }

      if (!nameVal || !phoneVal) return; // Skip invalid records

      // Resolve Plan
      let plan = plans.find(p => p.name.includes(planNameVal) || p.nameEn.toLowerCase().includes(planNameVal.toLowerCase()));
      if (!plan) {
        plan = defaultPlan;
      }

      // Resolve Start date
      let startDate = new Date();
      if (startDateValRaw) {
        const parsedDate = new Date(startDateValRaw);
        if (!isNaN(parsedDate.getTime())) {
          startDate = parsedDate;
        }
      }

      // Calculate End date
      const end = new Date(startDate);
      if (plan.durationType === 'days') {
        end.setDate(startDate.getDate() + plan.duration);
      } else if (plan.durationType === 'months') {
        end.setMonth(startDate.getMonth() + plan.duration);
      } else {
        end.setFullYear(startDate.getFullYear() + plan.duration);
      }

      const id = `CUST-${generateId()}`;
      const customer = {
        id,
        name: nameVal,
        phone: phoneVal,
        email: emailVal,
        gender: genderVal as 'male' | 'female',
        planId: plan.id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        paymentStatus,
        balance: paymentStatus === 'unpaid' ? plan.price : paymentStatus === 'partial' ? plan.price / 2 : 0,
        notes: t('تم الاستيراد من ملف Excel', 'Imported from Excel'),
        qrCode: id,
        createdAt: new Date().toISOString()
      };

      saveCustomer(customer);

      // Create Payment Transaction
      if (paymentStatus !== 'unpaid') {
        const amountPaid = paymentStatus === 'paid' ? plan.price : plan.price / 2;
        savePayment({
          id: `PAY-${generateId()}`,
          customerId: id,
          amount: amountPaid,
          date: new Date().toISOString(),
          method: 'cash',
          status: 'completed',
          notes: t('فاتورة مستوردة من إكسل', 'Imported invoice')
        });
      }

      successCount++;
    });

    logs.push(t(`تم استيراد ${successCount} سجل بنجاح.`, `Imported ${successCount} records successfully.`));
    setImportLogs(logs);
    setLoading(false);
    setStep(4);
    refreshData();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <AppShell>
      <div className="page-container animate-fade-in" style={{ maxWidth: '900px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }} className="mb-1">
          {t('استيراد البيانات من ملف Excel / CSV', 'Import from Excel / CSV')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mb-3">
          {t('قم برفع ملفك وسيقوم النظام بمطابقة الأعمدة والتحقق من صحة أرقام الهواتف والتواريخ بشكل تلقائي.', 'Upload your spreadsheet. The system will map columns and validate phone numbers/dates.')}
        </p>

        {/* Setup Steps Visual */}
        <div className="flex-between mb-3" style={{ maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="flex-center" style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: step >= s ? 'var(--primary)' : 'var(--bg-tertiary)',
                color: step >= s ? 'white' : 'var(--text-secondary)',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}>
                {s}
              </div>
              <span style={{ fontSize: '0.8rem', color: step >= s ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {s === 1 && t('رفع الملف', 'Upload')}
                {s === 2 && t('مطابقة الأعمدة', 'Map Columns')}
                {s === 3 && t('المراجعة والتحقق', 'Validate')}
                {s === 4 && t('النتيجة', 'Done')}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Upload Dropzone */}
        {step === 1 && (
          <div className="card">
            <div 
              className="dropzone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
              />
              <FileSpreadsheet className="dropzone-icon" size={48} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }} className="mb-1">
                {t('اسحب وأفلت الملف هنا أو انقر للتصفح', 'Drag & drop your file here, or click to browse')}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {t('يدعم صيغ .xlsx و .csv و .xls', 'Supports .xlsx, .csv, .xls formats')}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Columns Mapping */}
        {step === 2 && (
          <div className="card">
            <h3 className="mb-2">{t('مطابقة أعمدة الملف مع حقول النظام', 'Map Column Headers')}</h3>
            <p className="mb-3" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {t('اختر العمود المقابل لكل حقل في النظام من القوائم المنسدلة.', 'Choose the header from your file that matches each field.')}
            </p>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">{t('الاسم الكامل (مطلوب)', 'Full Name (Required)')}</label>
                <select className="form-select" value={mapping.name} onChange={(e) => handleMapChange('name', e.target.value)}>
                  <option value="">-- {t('اختر العمود', 'Select Column')} --</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('رقم الهاتف (مطلوب)', 'Phone Number (Required)')}</label>
                <select className="form-select" value={mapping.phone} onChange={(e) => handleMapChange('phone', e.target.value)}>
                  <option value="">-- {t('اختر العمود', 'Select Column')} --</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">{t('البريد الإلكتروني', 'Email')}</label>
                <select className="form-select" value={mapping.email} onChange={(e) => handleMapChange('email', e.target.value)}>
                  <option value="">-- {t('اختر العمود (اختياري)', 'Select Column (Optional)')} --</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('الجنس (ذكر/أنثى)', 'Gender')}</label>
                <select className="form-select" value={mapping.gender} onChange={(e) => handleMapChange('gender', e.target.value)}>
                  <option value="">-- {t('اختر العمود (اختياري)', 'Select Column (Optional)')} --</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">{t('الباقة / الاشتراك', 'Plan / Subscription')}</label>
                <select className="form-select" value={mapping.plan} onChange={(e) => handleMapChange('plan', e.target.value)}>
                  <option value="">-- {t('اختر العمود', 'Select Column')} --</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('تاريخ بدء الاشتراك', 'Start Date')}</label>
                <select className="form-select" value={mapping.startDate} onChange={(e) => handleMapChange('startDate', e.target.value)}>
                  <option value="">-- {t('اختر العمود', 'Select Column')} --</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('حالة الدفع المالي', 'Payment Status')}</label>
                <select className="form-select" value={mapping.paymentStatus} onChange={(e) => handleMapChange('paymentStatus', e.target.value)}>
                  <option value="">-- {t('اختر العمود', 'Select Column')} --</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-between mt-3">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>{t('تراجع', 'Back')}</button>
              <button className="btn btn-primary" onClick={runValidation}>{t('التحقق والمراجعة', 'Validate Data')}</button>
            </div>
          </div>
        )}

        {/* Step 3: Verification / Preview */}
        {step === 3 && (
          <div className="card">
            <h3 className="mb-2">{t('مراجعة والتحقق من البيانات المستخرجة', 'Validate & Review Data')}</h3>
            <p className="mb-3" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {t(`قراءة ${parsedData.length} سطر من الملف. مراجعة المشاكل المحتملة قبل الاستيراد النهائي.`, `Found ${parsedData.length} rows. Please review errors before importing.`)}
            </p>

            {validationErrors.length > 0 ? (
              <div className="alert alert-warning flex-column mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                  <AlertCircle size={16} />
                  <span>{t('تم العثور على ملاحظات أو أخطاء:', 'Validation warnings found:')}</span>
                </div>
                <ul style={{ marginInlineStart: '1.5rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  {validationErrors.map((err, index) => <li key={index}>{err}</li>)}
                </ul>
              </div>
            ) : (
              <div className="alert alert-success mb-3">
                <Check size={16} />
                <span>{t('جميع أرقام الهواتف والبيانات صالحة ومستعدة للاستيراد مباشرة بدون تكرار!', 'All data is clean and ready for duplicate-free importing!')}</span>
              </div>
            )}

            {/* Micro Table Preview */}
            <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('الاسم كامل', 'Name')}</th>
                    <th>{t('رقم الهاتف', 'Phone')}</th>
                    <th>{t('البريد الإلكتروني', 'Email')}</th>
                    <th>{t('الباقة', 'Plan')}</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      <td>{row[mapping.name]}</td>
                      <td>{row[mapping.phone]}</td>
                      <td>{row[mapping.email]}</td>
                      <td>{row[mapping.plan]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 10 && (
                <div className="text-center" style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  + {parsedData.length - 10} {t('سجلات إضافية في الملف', 'more records in file')}
                </div>
              )}
            </div>

            <div className="flex-between mt-3">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>{t('السابق', 'Back')}</button>
              <button className="btn btn-success" onClick={executeImport}>
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                {t('بدء الاستيراد الفعلي وحفظ البيانات', 'Execute Import & Save')}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Import Complete */}
        {step === 4 && (
          <div className="card text-center" style={{ padding: '3rem 2rem' }}>
            <div className="flex-center" style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              margin: '0 auto 1.5rem',
              fontSize: '2rem'
            }}>
              ✓
            </div>
            <h2 className="mb-2">{t('اكتمل الاستيراد بنجاح!', 'Import Completed Successfully!')}</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }} className="mb-3">
              {importLogs.map((l, index) => <p key={index}>{l}</p>)}
            </div>

            <button className="btn btn-primary" onClick={() => router.push('/customers')}>
              {t('الرجوع لقائمة المشتركين', 'Go to Subscribers List')}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
