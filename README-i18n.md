# Internationalization (i18n) Setup

## Overview
The application includes a scoped i18n system for public pages (home, pricing) with support for multiple languages.

## Current Implementation

### Supported Languages
- English (en) - Default
- Spanish (es) - Structure ready
- French (fr) - Structure ready  
- German (de) - Structure ready

### Components Added
- `src/lib/i18n.ts` - Core i18n utilities and types
- `src/contexts/LanguageContext.tsx` - Language context provider
- `src/hooks/useTranslation.ts` - Translation hook
- `src/components/ui/language-toggle.tsx` - Language switcher component
- `src/locales/en.ts` - English translations
- `src/locales/index.ts` - Locale exports

### Pages Updated
- `src/pages/Index.tsx` - Home page with i18n
- `src/pages/Pricing.tsx` - Pricing page with i18n
- `src/App.tsx` - Wrapped with LanguageProvider

## How to Add New Languages

### 1. Create Translation File
Create a new file in `src/locales/` (e.g., `es.ts` for Spanish):

```typescript
// src/locales/es.ts
export default {
  home: {
    seo: {
      title: "FindableAI – Plataforma de Optimización de Visibilidad en IA",
      description: "Optimiza tu marca para el descubrimiento de la IA...",
      keywords: "SEO IA, visibilidad IA, optimización de marca..."
    },
    hero: {
      announcement: "Nuevo: Puntuación de Visibilidad IA 2.0",
      heading: "Optimiza tu marca para el",
      headingHighlight: "descubrimiento de IA",
      // ... continue with all translations
    },
    // ... rest of structure matches en.ts
  },
  pricing: {
    // ... pricing translations
  }
};
```

### 2. Update Locale Index
Add the new locale to `src/locales/index.ts`:

```typescript
export { default as en } from './en';
export { default as es } from './es'; // Add this line

export const supportedLocales = ['en', 'es'] as const; // Add 'es'
```

### 3. Update Type Definitions
Add the new language to `src/lib/i18n.ts`:

```typescript
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de'; // Add new language

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  es: { name: 'Spanish', nativeName: 'Español' }, // Add this
  // ... rest
};
```

## Usage

### In Components
```typescript
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.hero.heading')}</h1>
      <p>{t('home.hero.description')}</p>
    </div>
  );
}
```

### With Parameters
```typescript
// In translation file
"welcome": "Welcome {{name}} to FindableAI!"

// In component
const message = t('welcome', { name: 'John' });
// Results in: "Welcome John to FindableAI!"
```

### Language Toggle
The `<LanguageToggle />` component automatically appears in the top-right of public pages and allows users to switch languages.

## Translation Structure

All translations follow a nested structure:
```
locale/
├── home/
│   ├── seo/
│   ├── hero/
│   ├── features/
│   └── howItWorks/
└── pricing/
    ├── seo/
    └── plans/
```

## Browser Language Detection
The system automatically detects the user's browser language preference and falls back to English if the preferred language isn't supported.

## Persistence
Language preferences are stored in localStorage and persist across sessions.

## SEO Benefits
- Proper hreflang implementation ready
- Localized meta tags and structured data
- Language-specific URLs possible with future router updates