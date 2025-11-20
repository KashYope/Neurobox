/**
 * Lazy Loading Test Script
 * Copy-paste this into browser console to verify lazy loading is working
 */

(async function testLazyLoading() {
  console.log('🧪 Starting Lazy Loading Tests...\n');

  // Test 1: Check localStorage keys
  console.log('📦 Test 1: Storage Configuration');
  const langKey = localStorage.getItem('neurobox_user_language');
  const timestampKey = localStorage.getItem('neurobox_user_language_timestamp');
  
  console.log(`  ✓ Language key: ${langKey || '❌ NOT SET'}`);
  console.log(`  ✓ Timestamp: ${timestampKey || '❌ NOT SET'}`);
  
  if (langKey) {
    const validLangs = ['fr', 'en', 'de', 'es', 'nl'];
    const isValid = validLangs.includes(langKey);
    console.log(`  ${isValid ? '✅' : '❌'} Language is ${isValid ? 'valid' : 'INVALID'}`);
  }
  console.log('');

  // Test 2: Check i18n configuration
  console.log('🌐 Test 2: i18n Configuration');
  if (window.i18next) {
    const currentLang = window.i18next.language;
    const loadedLanguages = Object.keys(window.i18next.store.data || {});
    
    console.log(`  ✓ Current language: ${currentLang}`);
    console.log(`  ✓ Loaded languages: ${loadedLanguages.join(', ')}`);
    
    const isLazyLoading = loadedLanguages.length <= 2;
    console.log(`  ${isLazyLoading ? '✅' : '❌'} Lazy loading: ${isLazyLoading ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`  ${isLazyLoading ? '✓' : '⚠'} Expected: 1-2 languages, Got: ${loadedLanguages.length}`);
  } else {
    console.log('  ❌ i18next not found - app may not be fully loaded');
  }
  console.log('');

  // Test 3: Check service worker cache
  console.log('💾 Test 3: Service Worker Cache');
  try {
    const cache = await caches.open('locale-cache');
    const keys = await cache.keys();
    const localeFiles = keys.filter(k => k.url.includes('/locales/'));
    
    console.log(`  ✓ Cached locale files: ${localeFiles.length}`);
    localeFiles.forEach(file => {
      const url = new URL(file.url);
      console.log(`    - ${url.pathname}`);
    });
    
    const isOptimized = localeFiles.length <= 4;
    console.log(`  ${isOptimized ? '✅' : '❌'} Cache optimization: ${isOptimized ? 'GOOD' : 'TOO MANY FILES'}`);
    console.log(`  ${isOptimized ? '✓' : '⚠'} Expected: ≤4 files, Got: ${localeFiles.length}`);
  } catch (error) {
    console.log('  ❌ Cache API not available or blocked');
    console.log(`     Error: ${error.message}`);
  }
  console.log('');

  // Test 4: Network requests check
  console.log('🌍 Test 4: Network Requests');
  console.log('  ℹ️ Open DevTools → Network tab → Filter by "locales"');
  console.log('  ℹ️ Expected on initial load: 2 files');
  console.log('  ℹ️ Expected after language switch: +2 files');
  console.log('');

  // Test 5: Verify language service
  console.log('🔧 Test 5: Language Service');
  if (window.getUserLanguage) {
    console.log('  ✅ Language service functions available');
    console.log('  ✓ getUserLanguage() can be called');
  } else {
    console.log('  ⚠️ Language service not exposed to window (expected in production)');
    console.log('  ℹ️ This is normal - service is internal');
  }
  console.log('');

  // Summary
  console.log('📊 Test Summary');
  const allPassed = langKey && timestampKey && 
                    window.i18next && 
                    Object.keys(window.i18next.store.data || {}).length <= 2;
  
  if (allPassed) {
    console.log('✅ All tests passed! Lazy loading is working correctly.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Switch language using UI buttons');
    console.log('2. Check Network tab for +2 file requests');
    console.log('3. Verify localStorage updates');
  } else {
    console.log('⚠️ Some tests failed. See details above.');
    console.log('');
    console.log('Troubleshooting:');
    console.log('- Ensure app is fully loaded');
    console.log('- Check browser console for errors');
    console.log('- Verify locale files exist in /public/locales/');
  }
  console.log('');

  // Helper functions
  console.log('💡 Helper Functions Available:');
  console.log('  - testLazyLoading.clearStorage() : Clear language preference');
  console.log('  - testLazyLoading.inspectCache() : View all cached locales');
  console.log('  - testLazyLoading.simulateSwitch(lang) : Test language switch');
  console.log('');

  // Return helper object
  return {
    clearStorage: () => {
      localStorage.removeItem('neurobox_user_language');
      localStorage.removeItem('neurobox_user_language_timestamp');
      console.log('✓ Language preference cleared');
      console.log('ℹ️ Reload page to see effect');
    },
    
    inspectCache: async () => {
      const cache = await caches.open('locale-cache');
      const keys = await cache.keys();
      const localeFiles = keys.filter(k => k.url.includes('/locales/'));
      
      console.log(`\n📦 Cached Locale Files (${localeFiles.length}):`);
      localeFiles.forEach((file, i) => {
        const url = new URL(file.url);
        console.log(`${i + 1}. ${url.pathname}`);
      });
      
      return localeFiles;
    },
    
    simulateSwitch: async (lang) => {
      if (!['fr', 'en', 'de', 'es', 'nl'].includes(lang)) {
        console.error(`❌ Invalid language: ${lang}`);
        console.log('Valid options: fr, en, de, es, nl');
        return;
      }
      
      console.log(`\n🔄 Simulating switch to: ${lang}`);
      
      if (window.i18next) {
        try {
          await window.i18next.changeLanguage(lang);
          localStorage.setItem('neurobox_user_language', lang);
          localStorage.setItem('neurobox_user_language_timestamp', new Date().toISOString());
          
          console.log('✅ Language switched successfully');
          console.log('ℹ️ Check Network tab for new locale file requests');
        } catch (error) {
          console.error('❌ Language switch failed:', error);
        }
      } else {
        console.error('❌ i18next not available');
      }
    }
  };
})().then(helpers => {
  window.testLazyLoading = helpers;
  console.log('✓ Test helpers saved to window.testLazyLoading');
});
