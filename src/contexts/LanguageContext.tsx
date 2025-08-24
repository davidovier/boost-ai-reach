import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SupportedLanguage, DEFAULT_LANGUAGE, getBrowserLanguage, LANGUAGE_STORAGE_KEY } from '@/lib/i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  translations: Record<string, any>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<Record<string, any>>({});

  // Initialize language from storage or browser preference
  useEffect(() => {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage;
    const initialLanguage = storedLanguage || getBrowserLanguage();
    setLanguageState(initialLanguage);
  }, []);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const translationModule = await import(`@/locales/${language}.ts`);
        setTranslations(translationModule.default || translationModule);
      } catch (error) {
        console.warn(`Failed to load translations for ${language}, falling back to English`);
        if (language !== DEFAULT_LANGUAGE) {
          try {
            const fallbackModule = await import(`@/locales/${DEFAULT_LANGUAGE}.ts`);
            setTranslations(fallbackModule.default || fallbackModule);
          } catch (fallbackError) {
            console.error('Failed to load fallback translations');
            setTranslations({});
          }
        }
      }
    };

    loadTranslations();
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const value = {
    language,
    setLanguage,
    translations,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}