# Quick Start: Multi-Language Support

## Minimal Integration (5 Minutes)

### 1. Initialize i18n
At the **very top** of `index.tsx`, add:

```typescript
import './src/i18n';
```

### 2. Add Language Selector Component
Add this component before the `App` component in `index.tsx`:

```typescript
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  
  const languages = {
    fr: 'Français',
    en: 'English',
    de: 'Deutsch',
    es: 'Español',
    nl: 'Nederlands'
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Globe className="w-4 h-4" />
        <span>Language</span>
      </div>
      {Object.entries(languages).map(([code, name]) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            i18n.language === code
              ? 'bg-teal-50 text-teal-700 font-medium'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
};
```

### 3. Add to Admin Menu
In the admin menu (around line 1863), add between existing sections:

```typescript
<LanguageSelector />
```

### 4. Use Translations in Components
Update any component to use translations:

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('app.name')}</h1>
      <button>{t('buttons.submit')}</button>
      <span>{t('situations.Crisis')}</span>
    </div>
  );
};
```

### 5. Wrap App with Suspense
At the bottom of `index.tsx` (around line 1951):

```typescript
import { Suspense } from 'react';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
  );
}
```

## That's It!

You now have:
- ✅ 5 languages support (FR, EN, DE, ES, NL)
- ✅ Language switching with persistence
- ✅ All UI translations ready to use
- ✅ Offline-first with cached translations

## Translation Keys Available

### Common
- `app.name` - "NeuroSooth"
- `buttons.*` - All button labels
- `labels.*` - All form labels
- `status.*` - Status messages
- `neuroTypes.*` - ADHD, ASD, Trauma, etc.
- `situations.*` - Crisis, Stress, Sleep, etc.

### Onboarding
- `onboarding:title` - "Welcome to NeuroSooth"
- `onboarding:subtitle`
- `onboarding:nameQuestion`
- `onboarding:neuroProfile`

## Example Usage

### Simple text:
```typescript
{t('buttons.cancel')}
```

### With variables:
```typescript
{t('messages.helpedPeople', { count: 42 })}
// Output: "42 people helped"
```

### Enum translation:
```typescript
{t(`situations.${Situation.Crisis}`)}
// Output: "Crise / Panique" (FR) or "Crisis / Panic" (EN)
```

### Multiple namespaces:
```typescript
const { t } = useTranslation(['common', 'onboarding']);
{t('onboarding:title')}
{t('buttons.start')}
```

## Google Translate API (Optional)

For dynamic content translation, set your API key:

```typescript
// In browser console or admin panel:
localStorage.setItem('google_translate_api_key', 'YOUR_API_KEY');
```

Or add to `.env`:
```env
VITE_GOOGLE_TRANSLATE_API_KEY=your_key_here
```

Then use the translation service:

```typescript
import { translationService } from './services/translationService';

const translated = await translationService.translate('Bonjour', {
  targetLang: 'en'
});
// Result: "Hello"
```

## No API Key?

Without an API key, the app still works perfectly:
- All static UI text translates instantly
- Dynamic content shows in original language (French)
- No errors, graceful fallback

The API is only needed for translating:
- Community-submitted exercises
- Partner content
- User-generated text

## Troubleshooting

**Language not changing?**
- Check browser console for errors
- Verify translation files exist in `public/locales/`
- Clear browser cache

**Missing translations?**
- Check if key exists in JSON file
- Use fallback: `t('key', 'Default text')`
- Check console for missing key warnings

**Performance issues?**
- Translations are cached in IndexedDB
- First load may be slower (loads JSON files)
- Subsequent loads are instant

## Need Help?

See full documentation: `MULTILANG_IMPLEMENTATION.md`
