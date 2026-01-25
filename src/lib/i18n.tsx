'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import React from 'react';

// Define available locales
export const locales = ['en', 'ja'] as const;
export type Locale = typeof locales[number];

// Type for translation keys
type TranslationKey = string;

// Type for translation values
type TranslationValue = string | string[] | Record<string, any>;

// Context type
type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, options?: { returnObjects?: boolean }) => string | string[];
  isLoading: boolean;
};

// Create context
export const I18nContext = createContext<I18nContextType | null>(null);

// Translation cache
const translations: Record<Locale, Record<string, any>> = {
  en: {},
  ja: {},
};

// Load translations
const loadTranslations = async (locale: Locale) => {
  if (Object.keys(translations[locale]).length > 0) return;
  
  try {
    const [common, header, avatar, about, resources, vrmviewer, home, finder] = await Promise.all([
      import(`../locales/${locale}/common.json`),
      import(`../locales/${locale}/header.json`),
      import(`../locales/${locale}/avatar.json`),
      import(`../locales/${locale}/about.json`),
      import(`../locales/${locale}/resources.json`),
      import(`../locales/${locale}/vrmviewer.json`),
      import(`../locales/${locale}/home.json`),
      import(`../locales/${locale}/finder.json`)
    ]);

    translations[locale] = {
      ...translations[locale],
      common: common.default,
      header: header.default,
      avatar: avatar.default,
      about: about.default,
      resources: resources.default,
      vrmviewer: vrmviewer.default,
      home: home.default,
      finder: finder.default
    };
  } catch (error) {
    console.error(`Error loading translations for ${locale}:`, error);
  }
};

// Provider props type
type I18nProviderProps = {
  children: ReactNode;
  defaultLocale?: Locale;
};

// Provider component
export const I18nProvider: React.FC<I18nProviderProps> = ({ 
  children, 
  defaultLocale = 'en' 
}) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return defaultLocale;
    return (localStorage.getItem('preferred-locale') as Locale) || defaultLocale;
  });
  const [isLoading, setIsLoading] = useState(true);

  const setLocale = useCallback(async (newLocale: Locale) => {
    setIsLoading(true);
    await loadTranslations(newLocale);
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale);
    }
    setIsLoading(false);
  }, []);

  const t = useCallback((key: TranslationKey, options?: { returnObjects?: boolean }): string | string[] => {
    if (isLoading) return key;
    
    const [namespace, ...keys] = key.split('.');
    let current: TranslationValue = translations[locale]?.[namespace];
    
    if (!current) {
      console.warn(`Translation namespace not found: ${namespace}`);
      return key;
    }
    
    for (const k of keys) {
      if (typeof current !== 'object' || Array.isArray(current)) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      current = (current as Record<string, TranslationValue>)[k];
      if (current === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    if (options?.returnObjects && Array.isArray(current)) {
      return current;
    }
    
    if (typeof current === 'string') {
      return current;
    }
    
    if (Array.isArray(current)) {
      console.warn(`Translation value is an array but returnObjects is not set: ${key}`);
      return key;
    }
    
    console.warn(`Translation value is not a string or array: ${key}`);
    return key;
  }, [locale, isLoading]);

  // Load initial translations
  React.useEffect(() => {
    const initTranslations = async () => {
      setIsLoading(true);
      await loadTranslations(locale);
      setIsLoading(false);
    };
    initTranslations();
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook for using translations
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
} 