import type { Settings, Tenant } from './store';

/** Retrieve settings from sessionStorage (client side) */
export const getSettings = (): Settings => {
  if (typeof window !== 'undefined') {
    const data = sessionStorage.getItem('settings');
    if (data) {
      try {
        return JSON.parse(data) as Settings;
      } catch (e) {
        console.error('Failed to parse settings from sessionStorage', e);
      }
    }
  }
  // Default fallback settings
  return {
    businessName: '',
    businessType: 'custom',
    currency: 'SAR',
    language: 'ar',
    theme: 'dark',
    isOnboarded: true,
  };
};

/** Persist settings to sessionStorage (client side) */
export const saveSettings = (settings: Settings): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('settings', JSON.stringify(settings));
  }
};

/** Get all tenants (client side) */
export const getTenants = (): Tenant[] => {
  if (typeof window !== 'undefined') {
    const data = sessionStorage.getItem('tenants');
    return data ? JSON.parse(data) : [];
  }
  return [];
};

/** Save tenants to sessionStorage (client side) */
export const saveTenants = (tenants: Tenant[]): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('tenants', JSON.stringify(tenants));
  }
};
