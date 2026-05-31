export interface BusinessConfig {
  nameAr: string;
  nameEn: string;
  icon: string;
  memberLabel: { ar: string; en: string };
  membersLabel: { ar: string; en: string };
  checkInLabel: { ar: string; en: string };
  planLabel: { ar: string; en: string };
  plansLabel: { ar: string; en: string };
  sessionLabel: { ar: string; en: string };
  hasQR: boolean;
  hasSessionCount: boolean;
}

export const BUSINESS_TYPES: Record<string, BusinessConfig> = {
  gym: {
    nameAr: 'صالة رياضية / نادي لياقة',
    nameEn: 'Gym / Fitness Center',
    icon: '🏋️',
    memberLabel: { ar: 'عضو', en: 'Member' },
    membersLabel: { ar: 'الأعضاء', en: 'Members' },
    checkInLabel: { ar: 'تسجيل دخول (حضور)', en: 'Gym Check-in' },
    planLabel: { ar: 'اشتراك / باقة', en: 'Membership Plan' },
    plansLabel: { ar: 'خطط الاشتراكات', en: 'Membership Plans' },
    sessionLabel: { ar: 'حصة / تمرين', en: 'Workout / Session' },
    hasQR: true,
    hasSessionCount: false,
  },
  clinic: {
    nameAr: 'عيادة / مركز طبي',
    nameEn: 'Clinic / Medical Center',
    icon: '🏥',
    memberLabel: { ar: 'مريض', en: 'Patient' },
    membersLabel: { ar: 'المرضى', en: 'Patients' },
    checkInLabel: { ar: 'تسجيل موعد / زيارة', en: 'Visit Entry' },
    planLabel: { ar: 'باقة علاجية', en: 'Treatment Plan' },
    plansLabel: { ar: 'الباقات العلاجية', en: 'Treatment Plans' },
    sessionLabel: { ar: 'جلسة / كشف', en: 'Session / Appointment' },
    hasQR: false,
    hasSessionCount: true,
  },
  salon: {
    nameAr: 'صالون تجميل / سبا',
    nameEn: 'Beauty Salon / Spa',
    icon: '💇',
    memberLabel: { ar: 'عميل', en: 'Client' },
    membersLabel: { ar: 'العملاء', en: 'Clients' },
    checkInLabel: { ar: 'حجز / تقديم خدمة', en: 'Service Check-in' },
    planLabel: { ar: 'باقة خدمات', en: 'Service Package' },
    plansLabel: { ar: 'باقات الخدمات', en: 'Service Packages' },
    sessionLabel: { ar: 'جلسة خدمة', en: 'Service Session' },
    hasQR: false,
    hasSessionCount: true,
  },
  coworking: {
    nameAr: 'مساحة عمل مشتركة',
    nameEn: 'Co-Working Space',
    icon: '🏢',
    memberLabel: { ar: 'مشترك / مستأجر', en: 'Coworker' },
    membersLabel: { ar: 'المشتركين', en: 'Coworkers' },
    checkInLabel: { ar: 'تسجيل دخول للمساحة', en: 'Space Entry' },
    planLabel: { ar: 'عضوية مساحة عمل', en: 'Workspace Plan' },
    plansLabel: { ar: 'خطط العضوية', en: 'Workspace Plans' },
    sessionLabel: { ar: 'يوم حضور', en: 'Day pass' },
    hasQR: true,
    hasSessionCount: false,
  },
  education: {
    nameAr: 'مركز تعليمي / دورات',
    nameEn: 'Educational Center / Courses',
    icon: '📚',
    memberLabel: { ar: 'طالب', en: 'Student' },
    membersLabel: { ar: 'الطلاب', en: 'Students' },
    checkInLabel: { ar: 'تسجيل حضور الحصة', en: 'Class Attendance' },
    planLabel: { ar: 'باقة تعليمية / كورس', en: 'Course subscription' },
    plansLabel: { ar: 'الباقات التعليمية', en: 'Course Packages' },
    sessionLabel: { ar: 'حصة / محاضرة', en: 'Lecture / Class' },
    hasQR: true,
    hasSessionCount: true,
  },
  custom: {
    nameAr: 'أعمال أخرى مخصصة',
    nameEn: 'Other / Custom Business',
    icon: '🏪',
    memberLabel: { ar: 'مشترك', en: 'Subscriber' },
    membersLabel: { ar: 'المشتركين', en: 'Subscribers' },
    checkInLabel: { ar: 'تسجيل حضور', en: 'Check-in' },
    planLabel: { ar: 'خطة اشتراك', en: 'Subscription Plan' },
    plansLabel: { ar: 'خطط الاشتراكات', en: 'Subscription Plans' },
    sessionLabel: { ar: 'جلسة / خدمة', en: 'Session / Unit' },
    hasQR: true,
    hasSessionCount: false,
  },
};

export const getBusinessConfig = (type: string): BusinessConfig => {
  return BUSINESS_TYPES[type] || BUSINESS_TYPES.custom;
};
