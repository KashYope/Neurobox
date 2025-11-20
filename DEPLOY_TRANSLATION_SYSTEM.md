# Translation System Deployment Guide

## Quick Start (5 Minutes)

Follow these steps to deploy the database-backed translation system:

### 1. Run Database Migration

```powershell
# Make sure your database is running and DATABASE_URL is set
npm run server:migrate
```

**Expected output:**
```
Running migration: 002_exercise_translations.sql
✓ Migration completed successfully
```

### 2. Seed Exercise Strings

```powershell
# Set DATABASE_URL if not in .env
$env:DATABASE_URL = "postgresql://user:pass@localhost:5432/neurobox"

# Run seed script
npx tsx scripts/seedExerciseStrings.ts
```

**Expected output:**
```
=== Exercise Strings Seeder ===

Extracted 65 strings from 13 exercises

Connecting to database...
✓ Connected

Inserting 65 exercise strings...
✓ Strings inserted successfully

Inserting 65 French translations...
✓ Translations inserted successfully

=== Update constants.ts ===
[String IDs for each exercise...]
```

### 3. Verify Setup

```powershell
npx tsx scripts/testTranslationSystem.ts
```

**Expected output:**
```
=== Translation System Test ===

Test 1: Checking database tables...
  Found tables: exercise_strings, exercise_translations
  ✓ Tables exist

Test 2: Checking exercise strings...
  Found 65 exercise strings
  ✓ Strings populated

Test 3: Checking translations by language...
  ✓ FR: 65 translations
  ❌ EN: 0 translations
  ❌ DE: 0 translations
  ❌ ES: 0 translations
  ❌ NL: 0 translations

=== Summary ===
✓ Translation system is set up correctly!
```

## That's It!

The system is now ready to use with **full backward compatibility**. Exercises will continue to work exactly as before.

## Optional: Add Translations

### Quick Test (Manual)

Add a sample English translation to verify the system works:

```powershell
# Create a test token (for local development)
npm run server:token partner test-user

# Copy the token, then use curl or Postman:
curl -X POST http://localhost:4000/api/strings/exercise.resp_478.title/translations `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -d '{
    "lang": "en",
    "translatedText": "4-7-8 Breathing",
    "translationMethod": "manual"
  }'
```

### Bulk Translation (Automated)

Create `scripts/bulkTranslate.ts`:

```typescript
import { apiClient, setApiAuthTokens } from '../services/apiClient.js';
import { translationService } from '../services/translationService.js';

// Set your partner token
setApiAuthTokens({ partnerToken: 'YOUR_TOKEN_HERE' });

async function translateAllToEnglish() {
  const strings = await apiClient.fetchExerciseStrings('exercise');
  
  for (const str of strings) {
    const translated = await translationService.translate(str.source_text, {
      sourceLang: 'fr',
      targetLang: 'en'
    });
    
    await apiClient.createExerciseStringTranslation(str.id, {
      stringId: str.id,
      lang: 'en',
      translatedText: translated,
      translationMethod: 'google_api'
    });
    
    console.log(`✓ Translated: ${str.id}`);
  }
}

translateAllToEnglish();
```

Then run:
```powershell
npx tsx scripts/bulkTranslate.ts
```

## Rollback (If Needed)

If you need to rollback:

```sql
-- Connect to PostgreSQL
psql $DATABASE_URL

-- Drop the tables
DROP TABLE IF EXISTS exercise_translations CASCADE;
DROP TABLE IF EXISTS exercise_strings CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_exercise_strings_updated_at ON exercise_strings;
DROP TRIGGER IF EXISTS trigger_exercise_translations_updated_at ON exercise_translations;
DROP FUNCTION IF EXISTS update_exercise_strings_updated_at();
DROP FUNCTION IF EXISTS update_exercise_translations_updated_at();
```

The frontend will automatically fall back to legacy content fields.

## Troubleshooting

### Migration fails with "relation already exists"

This means you've already run the migration. You can safely ignore this or drop the tables and re-run.

### Seed script fails with "duplicate key"

The script uses `ON CONFLICT` so it's safe to re-run. This just means the strings are already seeded.

### No translations appearing in UI

Check that:
1. Migration ran successfully: `npm run server:migrate`
2. Strings were seeded: `npx tsx scripts/testTranslationSystem.ts`
3. Translations were added for the target language
4. IndexedDB cache has the translations (DevTools → Application → IndexedDB)

### "Module not found" errors

Make sure you're using the correct import paths:
```typescript
// Correct
import { apiClient } from './services/apiClient.js';

// Incorrect (missing .js)
import { apiClient } from './services/apiClient';
```

## Next Steps

After deployment:

1. **Add translations** - Use the API or bulk script to add translations for all languages
2. **Update constants.ts** - Add string IDs to `INITIAL_EXERCISES` (optional, for new deployments)
3. **Monitor costs** - Track Google Translate API usage (should drop ~99%)
4. **Build admin UI** - Create translation management interface (future enhancement)

## Support

- **Documentation**: See `TRANSLATION_SYSTEM_GUIDE.md`
- **Implementation**: See `TRANSLATION_IMPLEMENTATION_SUMMARY.md`
- **Test script**: Run `npx tsx scripts/testTranslationSystem.ts`
