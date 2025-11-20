# Translation System Guide

## Overview

The Neurobox application now uses a **database-backed translation system** for exercise content. This system:

- Stores translatable strings in PostgreSQL tables
- Caches translations locally in IndexedDB
- Resolves string IDs to localized text on the frontend
- Reduces translation costs by 99% (translate once, serve to all users)

## Architecture

### String ID Format

Exercise content is stored using string IDs like:
- `exercise.resp_478.title` - Exercise title
- `exercise.resp_478.description` - Exercise description  
- `exercise.resp_478.step_1` - First step
- `exercise.resp_478.warning` - Warning text

### Database Tables

**PostgreSQL:**
- `exercise_strings` - Master list of translatable strings
- `exercise_translations` - Translations in different languages

**IndexedDB:**
- `exerciseStrings` - Cached source strings
- `exerciseStringTranslations` - Cached translations

## Setup Instructions

### 1. Run Database Migration

```powershell
npm run server:migrate
```

This creates the `exercise_strings` and `exercise_translations` tables.

### 2. Seed Initial Exercise Strings

```powershell
# Set DATABASE_URL if not already in environment
$env:DATABASE_URL="postgresql://user:pass@localhost:5432/neurobox"

# Run the seed script
npx tsx scripts/seedExerciseStrings.ts
```

This extracts content from `INITIAL_EXERCISES` and inserts it into the database.

### 3. Add Translations

#### Option A: Via API (Manual)

```bash
# Add English translation for a title
curl -X POST http://localhost:4000/api/strings/exercise.resp_478.title/translations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -d '{
    "lang": "en",
    "translatedText": "4-7-8 Breathing",
    "translationMethod": "manual"
  }'
```

#### Option B: Via Google Translate API (Bulk)

Create a script to translate all strings at once:

```typescript
import { apiClient } from './services/apiClient';
import { translationService } from './services/translationService';

async function translateAllStrings(targetLang: 'en' | 'de' | 'es' | 'nl') {
  // Fetch all source strings
  const strings = await apiClient.fetchExerciseStrings('exercise');
  
  // Translate each string
  for (const str of strings) {
    const translatedText = await translationService.translate(str.source_text, {
      sourceLang: 'fr',
      targetLang
    });
    
    // Save to database
    await apiClient.createExerciseStringTranslation(str.id, {
      stringId: str.id,
      lang: targetLang,
      translatedText,
      translationMethod: 'google_api'
    });
  }
  
  console.log(`Translated ${strings.length} strings to ${targetLang}`);
}

// Translate to all languages
await translateAllStrings('en');
await translateAllStrings('de');
await translateAllStrings('es');
await translateAllStrings('nl');
```

## Usage

### Frontend Resolution

The `contentResolver` service automatically resolves string IDs to localized text:

```typescript
import { contentResolver } from './services/contentResolver';
import { getUserLanguage } from './services/languageService';

// Resolve a single exercise
const exercise = await contentResolver.resolveExercise(rawExercise);

// Resolve multiple exercises
const exercises = await contentResolver.resolveExercises(rawExercises);
```

### Component Integration

In React components, exercises are automatically resolved:

```typescript
function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [resolved, setResolved] = useState(exercise);
  const { i18n } = useTranslation();
  
  useEffect(() => {
    contentResolver.resolveExercise(exercise, i18n.language)
      .then(setResolved);
  }, [exercise, i18n.language]);
  
  return (
    <div>
      <h3>{resolved.title}</h3>
      <p>{resolved.description}</p>
    </div>
  );
}
```

## API Endpoints

### Exercise Strings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/strings` | List all strings | Public |
| GET | `/api/strings?context=exercise` | Filter by context | Public |
| GET | `/api/strings/:id` | Get specific string | Public |
| POST | `/api/strings` | Create new string | Partner/Moderator |
| DELETE | `/api/strings/:id` | Delete string | Moderator |

### Translations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/strings/:id/translations` | Get translations for string | Public |
| GET | `/api/strings/translations/:lang` | Get all translations for language | Public |
| POST | `/api/strings/:id/translations` | Add/update translation | Partner/Moderator |
| POST | `/api/strings/bulk` | Bulk import strings + translations | Moderator |

## Cost Comparison

### Before (Runtime Translation)
- Every user translates same content via Google API
- Cost: ~$0.02 per user per language
- **1000 users → $20 per language**

### After (Database Translation)
- Translate once, store in database
- Serve from cache to all users
- One-time cost: ~$0.02 per language
- **1000 users → $0.02 per language (99% savings)**

## Migration Strategy

### Phase 1: Backward Compatibility
- Keep legacy content fields (`title`, `description`, `steps`)
- Add optional string ID fields (`titleStringId`, etc.)
- Content resolver falls back to legacy fields if no string IDs

### Phase 2: Gradual Migration
- Run seed script to populate database
- Update `constants.ts` with string IDs
- New exercises automatically use string IDs

### Phase 3: Full Adoption
- All exercises use string IDs
- Remove legacy content fields (breaking change)
- Simplify Exercise type

## Troubleshooting

### Translations not appearing

1. Check if translations exist in database:
```sql
SELECT * FROM exercise_translations WHERE lang = 'en';
```

2. Check IndexedDB cache (DevTools → Application → IndexedDB → `neurobox_offline` → `exerciseStringTranslations`)

3. Clear cache and reload:
```typescript
contentResolver.clearCache();
```

### Migration fails

Ensure you're running migration 002 after migration 001:
```powershell
npm run server:migrate
```

Check PostgreSQL logs for errors.

## Future Enhancements

- [ ] Translation management UI in admin panel
- [ ] Bulk translation via UI (select language, click translate)
- [ ] Translation coverage metrics
- [ ] Export/import translations as JSON
- [ ] Support for tags and situation names
- [ ] Automatic translation on exercise creation
