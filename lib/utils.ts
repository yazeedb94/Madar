export const formatDate = (dateString: string, lang: 'ar' | 'en' = 'ar'): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  if (lang === 'ar') {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getRemainingDays = (endDateString: string): number => {
  if (!endDateString) return 0;
  const end = new Date(endDateString);
  const now = new Date();
  // reset hours for exact day diff
  end.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const formatCurrency = (amount: number, currency: string = 'USD', lang: 'ar' | 'en' = 'ar'): string => {
  const formatted = amount.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return `${formatted} ${currency}`;
};

export const getSubscriptionStatus = (endDateString: string): 'active' | 'expiring' | 'expired' => {
  const remaining = getRemainingDays(endDateString);
  if (remaining < 0) return 'expired';
  if (remaining <= 7) return 'expiring';
  return 'active';
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11).toUpperCase();
};
