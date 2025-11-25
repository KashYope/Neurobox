import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          devOptions: {
            enabled: true,
            suppressWarnings: true,
            type: 'module'
          },
          includeAssets: ['offline.html', 'images/*.png', 'images/*.svg', 'icons/*.svg'],
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
            cleanupOutdatedCaches: true,
            runtimeCaching: [
              {
                urlPattern: ({ url }) => url.pathname.startsWith('/api/exercises'),
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-exercises-cache',
                  networkTimeoutSeconds: 10,
                  cacheableResponse: {
                    statuses: [0, 200]
                  },
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
                  }
                }
              },
              {
                urlPattern: ({ url }) => url.pathname.startsWith('/api'),
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-runtime-cache',
                  networkTimeoutSeconds: 10,
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          },
          manifest: {
            name: 'NeuroSooth - Régulation Somatique',
            short_name: 'NeuroSooth',
            description:
              'Programme somatique et exercices guidés pour apaiser le système nerveux et suivre sa progression.',
            theme_color: '#0f172a',
            background_color: '#f8fafc',
            display: 'standalone',
            scope: '/',
            start_url: '/',
            id: '/',
            lang: 'fr',
            orientation: 'portrait',
            prefer_related_applications: false,
            icons: [
              { src: '/icons/app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
              { src: '/icons/maskable-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
            ],
            screenshots: [
              {
                src: '/icons/screenshot-onboarding.svg',
                sizes: '750x1334',
                type: 'image/svg+xml'
              },
              {
                src: '/icons/screenshot-library.svg',
                sizes: '750x1334',
                type: 'image/svg+xml'
              },
              {
                src: '/icons/screenshot-detail.svg',
                sizes: '750x1334',
                type: 'image/svg+xml'
              }
            ]
          },
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'esnext'
      },
      esbuild: {
        target: 'esnext'
      }
    };
});
