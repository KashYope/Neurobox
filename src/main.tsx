import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import './i18n';
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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-slate-600">Loading...</div>
        </div>
      }
    >
      <App />
    </Suspense>
  );
}
