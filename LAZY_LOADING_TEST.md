# Lazy Loading Language - Testing Guide

## What Was Implemented

### 1. Lazy Loading Strategy
- **Before**: All 5 languages (FR, EN, DE, ES, NL) loaded on app start
- **After**: Only selected language loads on-demand
- **Benefit**: ~80% reduction in initial language data (from 515KB to ~103KB)

### 2. Priority Storage
- Language preference stored with custom key: `neurobox_user_language`
- Timestamp tracked: `neurobox_user_language_timestamp`
- Falls back to browser language, then French

### 3. Service Worker Caching
- Locale files cached with `StaleWhileRevalidate` strategy
- Max 10 entries (5 languages × 2 namespaces)
- 7-day expiration
- Works offline after first load

### 4. Language Service
Created `services/languageService.ts` with utilities:
- `getUserLanguage()`: Get stored preference
- `setUserLanguage()`: Save with timestamp
- `loadLanguageTranslations()`: On-demand loading
- `getSupportedLanguages()`: Get language list
- `clearLanguagePreference()`: For testing

---

## How to Test

### Test 1: Initial Load (No Preference)
**Expected**: Loads browser language or French fallback, only 2 locale files

```powershell
# Clear storage first
npm run dev
# In browser console:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

**Verify**:
1. Open DevTools → Network tab → Filter by "locales"
2. Should see only 2 requests:
   - `/locales/{lang}/common.json`
   - `/locales/{lang}/onboarding.json`
3. Check localStorage:
   ```js
   localStorage.getItem('neurobox_user_language') // Should be browser lang or 'fr'
   ```

### Test 2: Language Selection
**Expected**: Loads selected language files on-demand

**Steps**:
1. On onboarding screen, click "Deutsch" button
2. Open Network tab in DevTools
3. Should see 2 new requests:
   - `/locales/de/common.json`
   - `/locales/de/onboarding.json`

**Verify**:
```js
localStorage.getItem('neurobox_user_language') // Should be 'de'
localStorage.getItem('neurobox_user_language_timestamp') // Should be ISO date
```

### Test 3: Persistence
**Expected**: Remembers language choice on reload

**Steps**:
1. Select "Español" on onboarding
2. Complete onboarding
3. Refresh page (`F5`)

**Verify**:
- UI should immediately show Spanish
- Network tab should show only Spanish locale files loaded

### Test 4: Language Switching (Post-Onboarding)
**Expected**: Switches language without reloading all locales

**Steps**:
1. Complete onboarding in English
2. Open admin menu (gear icon)
3. Switch to "Nederlands"
4. Check Network tab

**Verify**:
- Should load Dutch locale files
- Previously loaded English files NOT reloaded
- UI updates immediately

### Test 5: Offline Mode
**Expected**: Works offline after first load

**Steps**:
1. Load app in English, switch to German (both languages now cached)
2. Open DevTools → Application → Service Workers
3. Check "Offline" checkbox
4. Switch between English and German

**Verify**:
- Language switches instantly (from cache)
- Network tab shows "(from ServiceWorker)"
- No network errors

### Test 6: Bundle Size Impact
**Expected**: Smaller initial bundle

```powershell
npm run build
# Check dist/locales/ folder size
```

**Before optimization**: ~515KB (all languages loaded)
**After optimization**: ~103KB (single language)

---

## Debugging

### Check Current Configuration
```js
// In browser console
console.log('Current language:', localStorage.getItem('neurobox_user_language'))
console.log('Timestamp:', localStorage.getItem('neurobox_user_language_timestamp'))
console.log('i18n language:', window.i18next?.language)
```

### Force Language Reset
```js
localStorage.removeItem('neurobox_user_language')
localStorage.removeItem('neurobox_user_language_timestamp')
location.reload()
```

### Check Service Worker Cache
```js
// View cached locale files
caches.open('locale-cache').then(cache => 
  cache.keys().then(keys => 
    console.log(keys.map(k => k.url))
  )
)

// Clear locale cache
caches.delete('locale-cache')
```

### Verify Lazy Loading
```js
// This should be empty or contain only current language
Object.keys(window.i18next?.store?.data || {})
```

---

## Performance Metrics

### Network Tab Metrics (Expected)
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial locale files loaded | 10 (5 langs × 2 ns) | 2 (1 lang × 2 ns) | 80% reduction |
| Initial locale data size | ~515KB | ~103KB | 80% reduction |
| Language switch time | 0ms (preloaded) | ~50-100ms (fetch) | Acceptable tradeoff |

### Storage Metrics (Expected)
| Storage | Before | After | Improvement |
|---------|--------|-------|-------------|
| localStorage | 1 key (`i18nextLng`) | 2 keys (lang + timestamp) | More explicit |
| IndexedDB | N/A | Translations table | Dynamic content caching |
| Service Worker cache | All locales | Only used locales | ~80% reduction |

---

## Common Issues

### Issue 1: Language Not Persisting
**Symptom**: Always reverts to French on reload
**Fix**: Check localStorage is enabled
```js
// Test localStorage
try {
  localStorage.setItem('test', '1')
  localStorage.removeItem('test')
  console.log('localStorage works')
} catch (e) {
  console.error('localStorage blocked:', e)
}
```

### Issue 2: Locale Files 404
**Symptom**: Console errors "Failed to load /locales/xx/common.json"
**Fix**: Check files exist in `public/locales/` directory
```powershell
ls C:\Users\KashYope\Neurobox\public\locales\
```

### Issue 3: UI Not Updating on Language Switch
**Symptom**: Language selector changes but UI stays same
**Fix**: Ensure all components use `useTranslation()` hook
```tsx
const { t } = useTranslation(['common', 'onboarding'])
// Use: {t('buttons.start')} not hardcoded text
```

### Issue 4: Service Worker Not Caching
**Symptom**: Network requests every time, no "(from ServiceWorker)"
**Fix**: Check service worker is registered
```js
navigator.serviceWorker.getRegistrations().then(regs => 
  console.log('SW registered:', regs.length > 0)
)

// Force update
navigator.serviceWorker.getRegistrations().then(regs =>
  regs.forEach(reg => reg.update())
)
```

---

## Success Criteria

✅ **Lazy Loading Works**
- Only 2 locale files load on initial visit
- Selected language loads on-demand (2 more files)
- Max 4 locale files loaded per session (2 languages)

✅ **Storage Optimization Works**
- Language stored in `neurobox_user_language` key
- Persists across sessions
- Timestamp tracked for cache invalidation

✅ **Performance Improvement**
- Initial load: ~80% less locale data
- Language switch: <100ms load time
- Offline mode: instant language switch (from cache)

✅ **User Experience**
- Language selector visible on onboarding top
- Selection persists after reload
- Works in admin menu post-onboarding
- No UI flash/flicker on language change

---

## Next Steps

Once testing confirms everything works:

1. **Optional Enhancements**:
   - Add loading indicator during language switch
   - Preload user's top 2 languages in background
   - Add language switch animation
   - Track language usage analytics

2. **Documentation**:
   - Update README with language setup
   - Document for partner portal integration
   - Add translation contribution guide

3. **Future Work**:
   - Server-side language detection (Accept-Language header)
   - RTL language support (Arabic, Hebrew)
   - Dynamic content translation (exercises, user-generated content)
