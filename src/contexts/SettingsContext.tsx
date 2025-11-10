
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SettingsState {
  currency: string;
  theme: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  priceAlerts: boolean;
  pinEnabled: boolean;
  language: string;
}

interface SettingsContextType {
  settings: SettingsState;
  updateSetting: (key: keyof SettingsState, value: any) => void;
  applyTheme: () => void;
}

const defaultSettings: SettingsState = {
  currency: 'USD',
  theme: 'light',
  pushNotifications: true,
  emailNotifications: false,
  priceAlerts: true,
  pinEnabled: false,
  language: 'en'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem('walletwave-settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const updateSetting = (key: keyof SettingsState, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('walletwave-settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const applyTheme = () => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme();
  }, [settings.theme]);

  useEffect(() => {
    applyTheme();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, applyTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
