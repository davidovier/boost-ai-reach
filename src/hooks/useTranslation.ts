import { useLanguageContext } from '@/contexts/LanguageContext';
import { getNestedValue, formatTranslation } from '@/lib/i18n';

export function useTranslation() {
  const { language, translations } = useLanguageContext();

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations, key);
    
    if (typeof translation === 'string') {
      return params ? formatTranslation(translation, params) : translation;
    }
    
    // Fallback to key if translation not found
    console.warn(`Translation missing for key: ${key} in language: ${language}`);
    return key;
  };

  return {
    t,
    language,
    translations,
  };
}