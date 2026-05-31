'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, saveSettings, Settings, seedDatabase, pullServerBackups } from './store';
import { getBusinessConfig, BusinessConfig } from './businessTypes';

interface AppContextType {
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  businessConfig: BusinessConfig;
  t: (ar: string, en: string) => string;
  refreshData: () => void;
  triggerCount: number;
  isHydrated: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    businessName: '',
    businessType: 'custom',
    currency: 'SAR',
    language: 'ar',
    theme: 'dark',
    isOnboarded: true,
  });
  
  const [triggerCount, setTriggerCount] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from LocalStorage (after hydration) + pull server backups on mount
  useEffect(() => {
    const initApp = async () => {
      // Pull latest tenant backups from server into localStorage on initial load
      await pullServerBackups();

      const stored = getSettings();
      setSettings(stored);

      // Apply theme
      document.documentElement.setAttribute('data-theme', stored.theme);

      // Apply direction
      document.body.dir = stored.language === 'ar' ? 'rtl' : 'ltr';
      document.body.setAttribute('dir', stored.language === 'ar' ? 'rtl' : 'ltr');

      setIsHydrated(true);
    };
    initApp();
  }, []);

  // Update settings state from localStorage when triggerCount changes
  useEffect(() => {
    if (!isHydrated) return;
    const stored = getSettings();
    setSettings(stored);

    // Apply theme
    document.documentElement.setAttribute('data-theme', stored.theme);

    // Apply direction
    document.body.dir = stored.language === 'ar' ? 'rtl' : 'ltr';
    document.body.setAttribute('dir', stored.language === 'ar' ? 'rtl' : 'ltr');
  }, [triggerCount, isHydrated]);


  const updateSettings = (newSettings: Settings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
    
    // Apply changes
    document.documentElement.setAttribute('data-theme', newSettings.theme);
    document.body.dir = newSettings.language === 'ar' ? 'rtl' : 'ltr';
    document.body.setAttribute('dir', newSettings.language === 'ar' ? 'rtl' : 'ltr');
    
    setTriggerCount(prev => prev + 1);
  };

  const setLanguage = (lang: 'ar' | 'en') => {
    const updated = { ...settings, language: lang };
    updateSettings(updated);
  };

  const setTheme = (theme: 'dark' | 'light') => {
    const updated = { ...settings, theme };
    updateSettings(updated);
  };

  const refreshData = () => {
    setTriggerCount(prev => prev + 1);
  };

  const businessConfig = getBusinessConfig(settings.businessType);

  const t = (ar: string, en: string): string => {
    return settings.language === 'ar' ? ar : en;
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        language: settings.language,
        setLanguage,
        theme: settings.theme,
        setTheme,
        businessConfig,
        t,
        refreshData,
        triggerCount,
        isHydrated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
