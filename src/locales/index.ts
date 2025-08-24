// Locale exports and utilities
export { default as en } from './en';

// Export supported locales for dynamic imports
export const supportedLocales = ['en'] as const;

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