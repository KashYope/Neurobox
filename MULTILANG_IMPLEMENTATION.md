# Multi-Language Implementation Guide

## Completed Steps

✅ 1. Installed i18next dependencies
✅ 2. Refactored enums to use English keys (ADHD, ASD, Crisis, etc.)
✅ 3. Created translation file structure with FR, EN, DE, ES, NL
✅ 4. Created i18n configuration (src/i18n.ts)
✅ 5. Added translation cache to IndexedDB
✅ 6. Implemented translationService with Google Cloud Translation API

## Remaining Steps

### Step 1: Initialize i18n in index.tsx

Add this import at the very top of `index.tsx` (before React imports):

```typescript
import './src/i18n'; // Initialize i18n
```

### Step 2: Wrap App with Suspense for i18n

In `index.tsx`, find the root render section (around line 1951) and wrap the App:

```typescript
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-slate-600">Loading...</div>
    </div>}>
      <App />
    </Suspense>
  );
}
```

### Step 3: Add Language Selector Component

Create a new component in `index.tsx` before the App component:

```typescript
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from './src/i18n';
import { Globe } from 'lucide-react';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as SupportedLanguage;

  const changeLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <Globe className="w-4 h-4" />
        <span>Language / Langue</span>
      </div>
      <div className="space-y-1">
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
          <button
            key={code}
            onClick={() => changeLanguage(code as SupportedLanguage)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              currentLang === code
                ? 'bg-teal-50 text-teal-700 font-medium border border-teal-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};
```

### Step 4: Add Language Selector to Admin Menu

In the admin menu section (around line 1863), add the LanguageSelector component before the BuyMeACoffeeButton:

```typescript
<div className="flex-1 overflow-y-auto p-4 space-y-5">
  <Button
    variant="primary"
    className="w-full justify-center gap-2"
    onClick={handleContributionAccess}
  >
    <Plus className="w-4 h-4" />
    Ajouter une technique
  </Button>

  <LanguageSelector />  {/* ADD THIS */}

  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-2">
    {/* ... existing sync status ... */}
  </div>
  {/* ... rest of admin menu ... */}
</div>
```

### Step 5: Replace Hardcoded Strings with Translations

Key components to update in `index.tsx`:

#### Onboarding Component (lines 87-138)

```typescript
const Onboarding: React.FC<{ onComplete: (user: UserProfile) => void }> = ({ onComplete }) => {
  const { t } = useTranslation(['common', 'onboarding']);
  const [name, setName] = useState('');
  const [selectedNeurotypes, setSelectedNeurotypes] = useState<NeuroType[]>([]);

  // ... existing logic ...

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('onboarding:title')}</h1>
          <p className="text-slate-600 mt-2">{t('onboarding:subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('onboarding:nameQuestion')}
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              placeholder={t('onboarding:namePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              {t('onboarding:neuroProfile')}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(NeuroType).filter(t => t !== NeuroType.None).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleNeurotype(type)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                    selectedNeurotypes.includes(type)
                      ? 'border-teal-500 bg-teal-50 text-teal-800'
                      : 'border-gray-200 hover:bg-gray-50 text-slate-600'
                  }`}
                >
                  <span>{t(`common:neuroTypes.${type}`)}</span>
                  {selectedNeurotypes.includes(type) && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            {t('buttons.start')}
          </Button>
        </form>
      </div>
    </div>
  );
};
```

#### Situation Filters (Dashboard)

In the filter bar section (around line 1765), update situation display:

```typescript
const App: React.FC = () => {
  const { t } = useTranslation();
  // ... existing state ...

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        {/* ... header content ... */}
        
        <div className="border-t border-gray-100 overflow-x-auto hide-scrollbar">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 min-w-max">
            <button
              onClick={() => setSituationFilter('All')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                situationFilter === 'All' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t('labels.all')}
            </button>
            {Object.values(Situation).map((sit) => (
              <button
                key={sit}
                onClick={() => setSituationFilter(sit)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  situationFilter === sit 
                    ? 'bg-teal-600 text-white shadow-md transform scale-105' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t(`situations.${sit}`)}
              </button>
            ))}
          </div>
        </div>
      </header>
      {/* ... rest of dashboard ... */}
    </div>
  );
};
```

### Step 6: Update Service Worker to Cache Locales

In `src/sw.ts`, add locale caching strategy. Find the existing cache strategies and add:

```typescript
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

// Cache translation files
registerRoute(
  ({ url }) => url.pathname.startsWith('/locales/'),
  new StaleWhileRevalidate({
    cacheName: 'translations-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          if (response && response.status === 200) {
            return response;
          }
          return null;
        },
      },
    ],
  })
);
```

### Step 7: Update API Client with Accept-Language Header

In `services/apiClient.ts`, add language header. Find the fetch calls and modify:

```typescript
import i18n from '../src/i18n';

// In each API method, add the Accept-Language header:
const headers: HeadersInit = {
  'Content-Type': 'application/json',
  'Accept-Language': i18n.language || 'fr',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
};

// Example for fetchExercises:
export const fetchExercises = async (): Promise<ServerExercise[]> => {
  const response = await fetch(`${BASE_URL}/exercises`, {
    headers: {
      'Accept-Language': i18n.language || 'fr'
    }
  });
  // ... rest of implementation
};
```

### Step 8: Create Data Migration Script

Create `scripts/migrateLegacyData.ts`:

```typescript
/**
 * Migration script to update legacy exercises from French enum values to English keys
 * Run with: npm run migrate:data
 */

import { openDB } from 'idb';

const ENUM_MIGRATIONS = {
  // NeuroType migrations
  'TDAH': 'ADHD',
  'TSA (Autisme)': 'ASD',
  'Trauma/CPTSD': 'Trauma',
  'HPE/HPI': 'HighSensitivity',
  'Neurotypique': 'None',
  
  // Situation migrations
  'Crise / Panique': 'Crisis',
  'Ruminations Mentales': 'Rumination',
  'Figement / Dissociation': 'Freeze',
  'Stress / Anxiété': 'Stress',
  'Colère / Meltdown': 'Anger',
  'Sommeil / Insomnie': 'Sleep',
  'Douleurs / Tensions': 'Pain',
  'Concentration': 'Focus',
  'Trauma / Flashback': 'Trauma'
};

async function migrateData() {
  console.log('Starting data migration...');
  
  const db = await openDB('neurobox_offline', 2);
  const tx = db.transaction('exercises', 'readwrite');
  const store = tx.objectStore('exercises');
  const exercises = await store.getAll();
  
  console.log(`Found ${exercises.length} exercises to migrate`);
  
  let migratedCount = 0;
  
  for (const exercise of exercises) {
    let needsUpdate = false;
    
    // Migrate neurotypes
    if (exercise.neurotypes) {
      exercise.neurotypes = exercise.neurotypes.map((nt: string) => {
        if (ENUM_MIGRATIONS[nt as keyof typeof ENUM_MIGRATIONS]) {
          needsUpdate = true;
          return ENUM_MIGRATIONS[nt as keyof typeof ENUM_MIGRATIONS];
        }
        return nt;
      });
    }
    
    // Migrate situations
    if (exercise.situation) {
      exercise.situation = exercise.situation.map((sit: string) => {
        if (ENUM_MIGRATIONS[sit as keyof typeof ENUM_MIGRATIONS]) {
          needsUpdate = true;
          return ENUM_MIGRATIONS[sit as keyof typeof ENUM_MIGRATIONS];
        }
        return sit;
      });
    }
    
    if (needsUpdate) {
      await store.put(exercise);
      migratedCount++;
    }
  }
  
  await tx.done;
  console.log(`Migration complete! Updated ${migratedCount} exercises`);
}

migrateData().catch(console.error);
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "migrate:data": "tsx scripts/migrateLegacyData.ts"
  }
}
```

## Testing Checklist

- [ ] Run `npm run dev` and check console for errors
- [ ] Verify language selector appears in admin menu
- [ ] Test switching between all 5 languages
- [ ] Verify translations persist after page reload
- [ ] Test onboarding flow in different languages
- [ ] Check situation filters translate correctly
- [ ] Verify enum values display translated labels
- [ ] Test offline mode with cached translations

## Environment Variables

Add to `.env` file:

```env
VITE_GOOGLE_TRANSLATE_API_KEY=your_api_key_here
```

Or set via admin menu for development (stored in localStorage).

## Google Cloud Translation API Setup

1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable "Cloud Translation API"
4. Create credentials (API Key)
5. Restrict API key to Translation API only (recommended)
6. Copy API key to `.env` file

## Cost Management

- Translation API: $20 per 1M characters
- With aggressive caching: ~$3-6/month for 1000 active users
- Monitor usage in Google Cloud Console
- Set up billing alerts

## Dynamic Content Translation

To translate exercise content on-demand:

```typescript
import { translationService } from './services/translationService';
import { useTranslation } from 'react-i18next';

const ExerciseCard: React.FC<{ exercise: Exercise }> = ({ exercise }) => {
  const { i18n } = useTranslation();
  const [translatedContent, setTranslatedContent] = useState(exercise);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (i18n.language !== 'fr') {
      setIsTranslating(true);
      translationService.translateExerciseContent(
        exercise,
        i18n.language as SupportedLanguage
      ).then(translated => {
        setTranslatedContent({ ...exercise, ...translated });
        setIsTranslating(false);
      });
    }
  }, [exercise, i18n.language]);

  return (
    <div>
      {isTranslating && <span>Translating...</span>}
      <h3>{translatedContent.title}</h3>
      <p>{translatedContent.description}</p>
    </div>
  );
};
```

## Next Steps

1. Initialize i18n in index.tsx
2. Add language selector to admin menu
3. Replace hardcoded strings with t() calls
4. Update service worker
5. Add Accept-Language headers
6. Run migration script
7. Test thoroughly
8. Deploy and monitor usage
