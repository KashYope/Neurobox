import React, { createContext, useCallback, useContext, useState, useEffect, useMemo } from 'react';
import i18n from './i18n';

interface I18nContextType {
  t: (key: string, options?: any) => string;
  i18n: typeof i18n;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate(prev => prev + 1);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const t = useCallback((key: string, options?: any) => {
    return i18n.t(key, options);
  }, []);

  const value = useMemo(() => ({ t, i18n }), [t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (namespaces?: string | string[]) => {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }

  // Create a wrapper function that handles namespaces without calling getFixedT
  // This avoids the React 19 event system bug in initReactI18next
  const namespaceKey = Array.isArray(namespaces) ? namespaces.join('|') : namespaces || '';
  const t = useCallback((key: string, options?: any) => {
    const ns = namespaceKey ? namespaceKey.split('|') : undefined;
    return context.i18n.t(key, { ...options, ns });
  }, [context.i18n, namespaceKey]);

  return { t, i18n: context.i18n };
};
