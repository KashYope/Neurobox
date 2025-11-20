# i18n Developer Guide

Quick reference for working with multi-language support in Neurobox.

---

## Quick Start

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation(['common', 'onboarding']);
  
  return (
    <div>
      <h1>{t('onboarding:title')}</h1>
      <button>{t('buttons.save')}</button>
    </div>
  );
}
```

### Namespace Structure

- **common**: UI labels, buttons, filters, dashboard, admin menu
- **onboarding**: Onboarding screen specific content

---

## Adding New Translations

### 1. Add Key to JSON Files

Edit **all 5 language files**:

```bash
public/locales/fr/common.json
public/locales/en/common.json
public/locales/de/common.json
public/locales/es/common.json
public/locales/nl/common.json
```

**Example** (add new button label):

```json
{
  "buttons": {
    "save": "Enregistrer",      // FR
    "delete": "Supprimer",       // FR
    "newButton": "Nouvelle Action"  // FR - NEW
  }
}
```

Repeat for EN, DE, ES, NL with appropriate translations.

### 2. Use in Component

```tsx
<button>{t('buttons.newButton')}</button>
```

---

## Translation Key Patterns

### Flat vs Nested

```json
// ❌ Avoid flat keys
{
  "saveButton": "Save",
  "deleteButton": "Delete"
}

// ✅ Use nested structure
{
  "buttons": {
    "save": "Save",
    "delete": "Delete"
  }
}
```

### Naming Conventions

```json
{
  "buttons": {},        // Action buttons
  "labels": {},         // Form labels
  "messages": {},       // Status/error messages
  "titles": {},         // Page/section titles
  "placeholders": {},   // Input placeholders
  "status": {},         // Status text
  "filters": {}         // Filter options
}
```

---

## Language Service API

### Change Language

```tsx
import { loadLanguageTranslations } from './services/languageService';

const handleLanguageChange = async (lang: 'fr' | 'en' | 'de' | 'es' | 'nl') => {
  try {
    await loadLanguageTranslations(lang);
    // Language changed, UI updates automatically
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};
```

### Get Current Language

```tsx
import { getUserLanguage } from './services/languageService';

const currentLang = getUserLanguage(); // 'fr' | 'en' | 'de' | 'es' | 'nl'
```

### Get Supported Languages

```tsx
import { getSupportedLanguages } from './services/languageService';

const languages = getSupportedLanguages();
// { fr: 'Français', en: 'English', de: 'Deutsch', ... }
```

---

## Translating Dynamic Content

For user-generated content (exercises, comments, etc.):

```tsx
import { translateText } from './services/translationService';

const translatedText = await translateText(
  'Bonjour le monde',  // Source text
  'fr',                // Source language
  'en'                 // Target language
);
// Result: "Hello world"
```

### Batch Translation

```tsx
import { translateBatch } from './services/translationService';

const translations = await translateBatch(
  ['Bonjour', 'Au revoir', 'Merci'],
  'fr',
  'en'
);
// Result: ['Hello', 'Goodbye', 'Thank you']
```

### Exercise Translation

```tsx
import { translateExerciseContent } from './services/translationService';

const translatedExercise = await translateExerciseContent(
  exercise,
  'fr',  // From
  'de'   // To
);
```

---

## Best Practices

### 1. Always Use Translation Keys

```tsx
// ❌ Bad: Hardcoded text
<button>Save</button>

// ✅ Good: Translation key
<button>{t('buttons.save')}</button>
```

### 2. Provide Context in Keys

```tsx
// ❌ Bad: Ambiguous
t('close')  // Close window? Close door? Close case?

// ✅ Good: Specific context
t('buttons.close')
t('modal.close')
t('session.close')
```

### 3. Use Interpolation for Variables

```tsx
// In JSON
{
  "welcome": "Welcome, {{name}}!"
}

// In component
t('welcome', { name: user.name })
// Result: "Welcome, Alice!"
```

### 4. Pluralization

```tsx
// In JSON
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}

// In component
t('items', { count: 1 })   // "1 item"
t('items', { count: 5 })   // "5 items"
```

### 5. Don't Translate Technical Terms

```json
{
  "error": {
    "404": "Page not found",
    "500": "Internal server error",
    "apiKey": "API key"  // Keep "API" in English
  }
}
```

---

## Common Patterns

### Language Selector Component

```tsx
import { useTranslation } from 'react-i18next';
import { getSupportedLanguages, loadLanguageTranslations } from './services/languageService';

function LanguageSelector() {
  const { i18n } = useTranslation();
  const languages = getSupportedLanguages();
  
  return (
    <select 
      value={i18n.language} 
      onChange={e => loadLanguageTranslations(e.target.value)}
    >
      {Object.entries(languages).map(([code, name]) => (
        <option key={code} value={code}>{name}</option>
      ))}
    </select>
  );
}
```

### Conditional Rendering Based on Language

```tsx
const { i18n } = useTranslation();

return (
  <div>
    {i18n.language === 'fr' && <FrenchSpecificContent />}
    {i18n.language !== 'fr' && <InternationalContent />}
  </div>
);
```

### Date Formatting (Language-Aware)

```tsx
const formatDate = (date: Date, language: string) => {
  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Usage
const { i18n } = useTranslation();
const formattedDate = formatDate(new Date(), i18n.language);
```

---

## Debugging

### Check Loaded Languages

```js
// Browser console
Object.keys(window.i18next?.store?.data || {})
// Should show only 1-2 languages (lazy loading)
```

### Check Current Language

```js
window.i18next?.language  // Current language code
localStorage.getItem('neurobox_user_language')  // Stored preference
```

### Test Translation Keys

```js
// Browser console
window.i18next?.t('buttons.save')  // Test if key exists
```

### Missing Translation Warnings

i18next logs warnings for missing keys:

```
i18next: key "buttons.missing" not found in namespace "common"
```

---

## File Organization

```
public/locales/
├── fr/
│   ├── common.json         # 103 lines - Main UI
│   └── onboarding.json     # 8 lines - Onboarding flow
├── en/
│   ├── common.json
│   └── onboarding.json
├── de/
│   ├── common.json
│   └── onboarding.json
├── es/
│   ├── common.json
│   └── onboarding.json
└── nl/
    ├── common.json
    └── onboarding.json
```

### When to Create New Namespace

Create a new namespace when:
- Content is logically separate (e.g. partner portal, moderation panel)
- File exceeds ~200 lines
- Content loads conditionally (admin vs user)

Example: `public/locales/fr/partner.json`

---

## Performance Tips

### 1. Lazy Load Namespaces

```tsx
// Load namespace on-demand
const { t, ready } = useTranslation('partner', { useSuspense: false });

if (!ready) return <Spinner />;
return <div>{t('partner:title')}</div>;
```

### 2. Avoid Re-renders

```tsx
// ❌ Creates new function every render
<button onClick={() => alert(t('confirm'))}></button>

// ✅ Use callback
const handleClick = useCallback(() => {
  alert(t('confirm'));
}, [t]);

<button onClick={handleClick}></button>
```

### 3. Cache Dynamic Translations

The `translationService` automatically caches:
- Memory cache (session)
- IndexedDB cache (persistent)

No manual caching needed.

---

## Migration Guide

### From Hardcoded French to i18n

**Before:**
```tsx
<button>Enregistrer</button>
<label>Prénom</label>
```

**After:**
```tsx
const { t } = useTranslation();

<button>{t('buttons.save')}</button>
<label>{t('labels.firstName')}</label>
```

**JSON:**
```json
{
  "buttons": { "save": "Enregistrer" },
  "labels": { "firstName": "Prénom" }
}
```

---

## Testing Translations

### Unit Tests

```tsx
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

test('renders translated button', () => {
  const { getByText } = render(
    <I18nextProvider i18n={i18n}>
      <MyComponent />
    </I18nextProvider>
  );
  
  expect(getByText(/save/i)).toBeInTheDocument();
});
```

### Manual Testing

1. Change language via selector
2. Verify UI updates
3. Check Network tab (should load 2 JSON files per language)
4. Go offline, switch language (should work from cache)

---

## Troubleshooting

### Issue: Translations Not Loading

**Check:**
1. Files exist in `public/locales/{lang}/`
2. JSON is valid (no trailing commas, proper quotes)
3. i18n is imported in `index.tsx`

### Issue: Language Not Persisting

**Check:**
1. localStorage is enabled
2. `neurobox_user_language` key exists
3. No browser extensions blocking storage

### Issue: Service Worker Not Caching Locales

**Solution:**
```js
// Force service worker update
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(reg => reg.update()));
```

---

## Resources

- **Testing Guide**: `LAZY_LOADING_TEST.md`
- **Implementation Details**: `LANGUAGE_OPTIMIZATION_COMPLETE.md`
- **Quick Start**: `QUICKSTART_I18N.md`
- **i18next Docs**: https://www.i18next.com/
- **react-i18next Docs**: https://react.i18next.com/
