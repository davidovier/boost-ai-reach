// i18n utility functions and types
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  es: { name: 'Spanish', nativeName: 'Español' },
  fr: { name: 'French', nativeName: 'Français' },
  de: { name: 'German', nativeName: 'Deutsch' },
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Utility to get nested object value by dot notation path
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Format translation with interpolation
export function formatTranslation(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

// Get browser preferred language
export function getBrowserLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  try {
    const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
    return isValidLanguage(browserLang) ? browserLang : DEFAULT_LANGUAGE;
  } catch (error) {
    console.warn('Error detecting browser language:', error);
    return DEFAULT_LANGUAGE;
  }
}

// Validate if a language code is supported
export function isValidLanguage(lang: string): lang is SupportedLanguage {
  return Object.keys(SUPPORTED_LANGUAGES).includes(lang);
}

// Get language display name
export function getLanguageDisplayName(lang: SupportedLanguage, native: boolean = true): string {
  const langInfo = SUPPORTED_LANGUAGES[lang];
  return native ? langInfo.nativeName : langInfo.name;
}

// Storage keys
export const LANGUAGE_STORAGE_KEY = 'findableai-language';