import { useLanguageContext } from '@/contexts/LanguageContext';
import { getNestedValue, formatTranslation } from '@/lib/i18n';

export function useTranslation() {
  const { language, translations, isLoading } = useLanguageContext();

  const t = (key: string, params?: Record<string, string | number>): string => {
    // Return empty string if still loading translations
    if (isLoading) {
      return '';
    }

    // Return empty string if no translations loaded yet
    if (!translations || Object.keys(translations).length === 0) {
      return '';
    }

    const translation = getNestedValue(translations, key);
    
    if (typeof translation === 'string') {
      return params ? formatTranslation(translation, params) : translation;
    }
    
    // Handle array case (for features, etc.)
    if (Array.isArray(translation)) {
      return translation.join(', ');
    }
    
    // Fallback to key if translation not found (only warn in development)
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Translation missing for key: ${key} in language: ${language}`);
    }
    
    // Return a cleaned version of the key as fallback
    return key.split('.').pop() || key;
  };

  return {
    t,
    language,
    translations,
    isLoading,
  };
}