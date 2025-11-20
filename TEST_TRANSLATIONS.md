# Testing Multi-Language Implementation

## Start the App

```powershell
npm run dev
```

## What Should Translate

### ✅ Currently Translates (Static UI)

1. **Onboarding Screen**
   - "Bienvenue sur NeuroSooth" → "Welcome to NeuroSooth" (EN)
   - "Comment vous appelez-vous ?" → "What's your name?" (EN)
   - Neurotype labels (TDAH → ADHD, TSA → ASD)
   - "Commencer l'aventure" button

2. **Dashboard Filters**
   - "Tout" → "All" (EN)
   - Situation buttons:
     - "Crise / Panique" → "Crisis / Panic" (EN)
     - "Stress / Anxiété" → "Stress / Anxiety" (EN)
     - etc.

3. **Dashboard Headers**
   - "Recommandé pour vous" → "Recommended for you" (EN)
   - "Basé sur votre profil" → "Based on your profile" (EN)
   - "Aucune technique trouvée" → "No technique found" (EN)

4. **Admin Menu**
   - "Espace admin" → "Admin Space" (EN)
   - "Actions rapides" → "Quick Actions" (EN)
   - "Ajouter une technique" → "Add Technique" (EN)
   - "Synchronisation" → "Synchronization" (EN)
   - "Mode hors ligne" → "Offline Mode" (EN)
   - "Jetons API" → "API Tokens" (EN)
   - "Sauver" buttons → "Save" (EN)

5. **Language Selector**
   - Always shows language names in their native language
   - Selected language is highlighted

### ❌ Does NOT Translate Yet (Expected)

1. **Exercise Content** (titles, descriptions, steps)
   - These are hardcoded in French in `constants.ts`
   - Would need Google Translate API to translate
   - OR manually translate in constants file

2. **Exercise Cards**
   - Titles like "Respiration 4-7-8"
   - Descriptions
   - Steps
   - Warnings

3. **Other Components** (not yet implemented)
   - Exercise detail view
   - Add exercise form
   - Partner portal
   - Moderation panel

## Testing Steps

### 1. Test Language Switching

1. Open http://localhost:5173
2. Complete onboarding (or skip by using existing user)
3. Click menu icon (top right)
4. Find "Language / Langue" section
5. Click "English"
6. **Expected**: 
   - Filters change to English
   - Admin menu text changes to English
   - Dashboard headers change to English

### 2. Test Onboarding in Different Languages

1. Open DevTools (F12)
2. Application → Local Storage → Clear All
3. Refresh page
4. Switch language in Language Selector (should see it on onboarding screen)
5. **Expected**: All onboarding text translates

### 3. Test Persistence

1. Switch to German ("Deutsch")
2. Refresh page
3. **Expected**: UI remains in German

### 4. Test All 5 Languages

Test each language and verify:
- ✅ FR (Français) - Original
- ✅ EN (English)
- ✅ DE (Deutsch)
- ✅ ES (Español)
- ✅ NL (Nederlands)

## Known Limitations

### Exercise Content Still in French
This is expected because:
1. Content is hardcoded in `constants.ts`
2. Dynamic translation requires Google Translate API key
3. Without API key, exercise titles/descriptions show in French

### To Translate Exercise Content

**Option A: Use Google Translate API** (Recommended)
1. Get API key from https://console.cloud.google.com
2. Add to `.env`: `VITE_GOOGLE_TRANSLATE_API_KEY=your_key`
3. Exercises will translate on-demand with caching

**Option B: Manually Translate** (Free, but more work)
1. Create translated versions in `constants.ts`
2. Add language detection logic
3. Load appropriate version based on current language

## Troubleshooting

### Language Selector Not Appearing?
- Check browser console for errors
- Verify `LanguageSelector` component exists in code
- Make sure you're in the admin menu

### Translations Not Working?
**Check console for errors like:**
- "i18next: key not found" → Key missing in JSON file
- "Failed to load" → Translation file missing/invalid JSON

**Fix:**
```powershell
# Verify JSON files exist
ls public/locales/en/
# Should show: common.json, onboarding.json

# Test JSON validity
Get-Content public/locales/en/common.json | ConvertFrom-Json
```

### UI Partially Translates?
This is expected! We've only translated:
- Onboarding
- Dashboard filters and headers
- Admin menu

Remaining components still need translation keys added.

## Next Steps to Complete Translation

### 1. Translate Exercise Cards
Add to components that display exercises:
```typescript
const ExerciseCard = ({ exercise }) => {
  const { t } = useTranslation();
  // Use t() for any hardcoded strings
  return (
    <div>
      <h3>{exercise.title}</h3> {/* Still in French */}
      <span>{t('labels.duration')}: {exercise.duration}</span>
    </span>
  );
};
```

### 2. Add More Translation Keys
For components like:
- Exercise detail view
- Add exercise form  
- Partner portal
- Moderation panel

### 3. Test With Google Translate API
To see dynamic content translation in action.

## Success Criteria

✅ Language selector visible and functional
✅ Situation filters translate correctly
✅ Dashboard headers translate
✅ Admin menu translates  
✅ Onboarding translates
✅ Language persists after refresh
✅ All 5 languages work
❌ Exercise content (needs API or manual translation)

## Current Status

**Static UI Translation: 70% Complete**
- Onboarding: 100%
- Dashboard: 80%
- Admin menu: 100%
- Exercise views: 0%
- Forms: 0%

**Dynamic Content: 0% (needs API key)**
