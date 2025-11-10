# Multi-Language Support Guide

This application now supports multiple languages (English and Croatian). This guide explains how the system works and how to add translations to new components.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [How to Use Translations](#how-to-use-translations)
4. [Adding New Translations](#adding-new-translations)
5. [Language Switcher](#language-switcher)
6. [File Structure](#file-structure)

## Overview

The multi-language feature is implemented using:
- **i18next**: Core internationalization framework
- **react-i18next**: React bindings for i18next
- **i18next-browser-languagedetector**: Automatic language detection

Supported languages:
- **English (en)** 🇬🇧
- **Croatian (hr)** 🇭🇷

## Architecture

### Configuration Files

#### `src/i18n/config.ts`
Main i18n configuration file that:
- Initializes i18next
- Loads translation resources
- Sets up language detection
- Configures localStorage persistence

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hr from './locales/hr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hr: { translation: hr }
    },
    fallbackLng: 'en',
    lng: localStorage.getItem('language') || 'en',
    interpolation: {
      escapeValue: false
    }
  });
```

#### Translation Files
- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/hr.json` - Croatian translations

### Translation Structure

Translations are organized by feature/section:

```json
{
  "header": {
    "pulseWallet": "Pulse Wallet",
    "portfolio": "Portfolio",
    "logout": "Logout"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "deposit": "Deposit",
    "withdraw": "Withdraw"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm"
  }
}
```

## How to Use Translations

### In React Components

1. **Import the useTranslation hook**:
```typescript
import { useTranslation } from 'react-i18next';
```

2. **Use the hook in your component**:
```typescript
const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
};
```

### Examples from the Codebase

#### AppHeader Component
```typescript
import { useTranslation } from 'react-i18next';

const AppHeader = () => {
  const { t } = useTranslation();

  return (
    <header>
      <span>{t('header.pulseWallet')}</span>
      <p>{t('header.portfolio')}</p>
      <button>{t('header.logout')}</button>
    </header>
  );
};
```

#### Layout Component (Navigation)
```typescript
const Layout = () => {
  const { t } = useTranslation();

  const menuItems = [
    {
      icon: Home,
      label: t('navigation.dashboard'),
      href: '/dashboard'
    },
    {
      icon: ArrowUpDown,
      label: t('navigation.deposit'),
      href: '/dashboard/deposit'
    }
  ];
};
```

#### Toast Messages
```typescript
toast({
  title: t('auth.signedOut'),
  description: t('auth.signedOutSuccess')
});
```

## Adding New Translations

### Step 1: Add to English Translation File
Open `src/i18n/locales/en.json` and add your new key:

```json
{
  "myFeature": {
    "title": "My Feature Title",
    "button": "Click Me",
    "description": "This is a description"
  }
}
```

### Step 2: Add Croatian Translation
Open `src/i18n/locales/hr.json` and add the Croatian equivalent:

```json
{
  "myFeature": {
    "title": "Naslov Moje Značajke",
    "button": "Klikni Me",
    "description": "Ovo je opis"
  }
}
```

### Step 3: Use in Your Component
```typescript
import { useTranslation } from 'react-i18next';

const MyFeature = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('myFeature.title')}</h1>
      <button>{t('myFeature.button')}</button>
      <p>{t('myFeature.description')}</p>
    </div>
  );
};
```

## Language Switcher

### LanguageSelector Component

The language selector is located in `src/components/LanguageSelector.tsx` and is integrated into the AppHeader.

```typescript
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
  };

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      {/* Language options */}
    </Select>
  );
};
```

### Features:
- Displays current language with flag emoji
- Persists selection to localStorage
- Immediately updates all translated text
- Located in the top header (desktop view)

## File Structure

```
src/
├── i18n/
│   ├── config.ts              # i18n configuration
│   └── locales/
│       ├── en.json            # English translations
│       └── hr.json            # Croatian translations
├── components/
│   ├── AppHeader.tsx          # Header with language selector
│   ├── LanguageSelector.tsx   # Language switcher component
│   └── Layout.tsx             # Navigation with translations
└── main.tsx                   # i18n initialization
```

## Translation Categories

### Currently Implemented

1. **header** - Header component text
2. **auth** - Authentication messages
3. **dashboard** - Dashboard labels
4. **navigation** - Menu navigation items
5. **wallet** - Wallet-related text
6. **settings** - Settings page
7. **admin** - Admin panel labels
8. **chat** - Chat interface
9. **staking** - Staking features
10. **kyc** - KYC verification
11. **transactions** - Transaction history
12. **common** - Common UI elements (buttons, actions)
13. **deposit** - Deposit page
14. **withdraw** - Withdraw page
15. **smartContracts** - Smart contracts
16. **bankTransfer** - Bank transfer
17. **toast** - Toast notifications

## Best Practices

### 1. Organize by Feature
Group related translations under a common key:
```json
{
  "userProfile": {
    "title": "User Profile",
    "editButton": "Edit Profile",
    "saveButton": "Save Changes"
  }
}
```

### 2. Use Descriptive Keys
Make keys self-explanatory:
```typescript
// Good
t('dashboard.totalBalance')

// Avoid
t('db.tb')
```

### 3. Handle Plurals
i18next supports pluralization:
```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

### 4. Variable Interpolation
Pass variables to translations:
```typescript
t('wallet.balance', { amount: 1000, currency: 'USD' })
```

```json
{
  "wallet": {
    "balance": "Your balance: {{amount}} {{currency}}"
  }
}
```

## Testing Language Switching

1. Run your development server
2. Navigate to the dashboard (must be logged in)
3. Click the language selector in the top header
4. Select "Hrvatski" (Croatian) or "English"
5. Observe that:
   - Header text changes
   - Navigation menu labels change
   - Toast messages appear in selected language
   - Selection is saved and persists on page reload

## Extending to More Languages

To add a new language (e.g., German):

1. Create `src/i18n/locales/de.json` with all translations
2. Update `src/i18n/config.ts`:
```typescript
import de from './locales/de.json';

i18n.init({
  resources: {
    en: { translation: en },
    hr: { translation: hr },
    de: { translation: de }  // Add new language
  }
});
```

3. Update `src/components/LanguageSelector.tsx`:
```typescript
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }  // Add new language
];
```

## Troubleshooting

### Translations Not Showing
- Ensure i18n is imported in `main.tsx`
- Check that translation keys exist in both language files
- Verify component is using `useTranslation()` hook

### Language Not Persisting
- Check browser localStorage for 'language' key
- Ensure `handleLanguageChange` saves to localStorage

### Missing Translations
- Add fallback text: `t('key', 'Fallback text')`
- Check browser console for missing key warnings

## Summary

The multi-language system is now fully integrated into:
- ✅ Header component with language selector
- ✅ Navigation menu (user and admin)
- ✅ Authentication flows
- ✅ Toast notifications
- ✅ Common UI elements

To translate any new component, simply:
1. Add translation keys to both JSON files
2. Import and use `useTranslation()` hook
3. Replace hardcoded text with `t('key')` calls
