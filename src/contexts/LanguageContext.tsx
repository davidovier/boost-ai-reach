import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SupportedLanguage, DEFAULT_LANGUAGE, getBrowserLanguage, LANGUAGE_STORAGE_KEY, isValidLanguage } from '@/lib/i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  translations: Record<string, any>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language from storage or browser preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      const validStoredLanguage = storedLanguage && isValidLanguage(storedLanguage) 
        ? storedLanguage as SupportedLanguage 
        : null;
      const initialLanguage = validStoredLanguage || getBrowserLanguage();
      setLanguageState(initialLanguage);
    }
  }, []);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const translationModule = await import(`@/locales/${language}.ts`);
        setTranslations(translationModule.default || translationModule);
      } catch (error) {
        console.warn(`Failed to load translations for ${language}, falling back to English`);
        if (language !== DEFAULT_LANGUAGE) {
          try {
            const fallbackModule = await import(`@/locales/${DEFAULT_LANGUAGE}.ts`);
            setTranslations(fallbackModule.default || fallbackModule);
            // Also update the language state to the fallback language
            setLanguageState(DEFAULT_LANGUAGE);
          } catch (fallbackError) {
            console.error('Failed to load fallback translations');
            setTranslations({});
          }
        } else {
          // If we're already trying to load the default language and it fails,
          // provide minimal fallback translations
          setTranslations({
            home: {
              hero: {
                heading: "Make Your Website",
                headingHighlight: "AI Discoverable",
                ctaPrimary: "Start Free Scan",
                ctaSecondary: "Sign In"
              }
            }
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  // Update HTML lang attribute when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    if (!isValidLanguage(lang)) {
      console.warn(`Invalid language code: ${lang}, falling back to ${DEFAULT_LANGUAGE}`);
      lang = DEFAULT_LANGUAGE;
    }
    
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  };

  const value = {
    language,
    setLanguage,
    translations,
    isLoading,
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