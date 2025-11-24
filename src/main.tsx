import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

import { I18nProvider } from './i18nContext';
import App from './App';

if (typeof window !== 'undefined') {
  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error('Service worker registration failed', error);
    }
  });
}

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <I18nProvider>
      <App />
    </I18nProvider>
  );
}
