// Locale exports and utilities
export { default as en } from './en';
export { default as es } from './es';
export { default as fr } from './fr';
export { default as de } from './de';

// Export supported locales for dynamic imports
export const supportedLocales = ['en', 'es', 'fr', 'de'] as const;

// Helper to dynamically import locale
export async function loadLocale(locale: string) {
  try {
    const module = await import(`./${locale}.ts`);
    return module.default;
  } catch (error) {
    console.warn(`Failed to load locale: ${locale}`);
    return null;
  }
}