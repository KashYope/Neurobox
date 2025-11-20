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
          includeAssets: [
            'icons/app-icon.svg',
            'icons/maskable-icon.svg',
            'icons/screenshot-onboarding.svg',
            'icons/screenshot-library.svg',
            'icons/screenshot-detail.svg'
          ],
          srcDir: 'src',
          filename: 'sw.ts',
          strategies: 'injectManifest',
          injectRegister: 'auto',
          devOptions: {
            enabled: true,
            suppressWarnings: true,
            type: 'module'
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
            lang: 'fr',
            orientation: 'portrait',
            icons: [
              { src: '/icons/app-icon.svg', sizes: '192x192', type: 'image/svg+xml' },
              { src: '/icons/app-icon.svg', sizes: '256x256', type: 'image/svg+xml' },
              { src: '/icons/app-icon.svg', sizes: '512x512', type: 'image/svg+xml' },
              { src: '/icons/app-icon.svg', sizes: '1024x1024', type: 'image/svg+xml' },
              { src: '/icons/maskable-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
              { src: '/icons/app-icon.svg', sizes: '180x180', type: 'image/svg+xml' }
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
          workbox: {
            runtimeCaching: [
              {
                urlPattern: ({ url }) => url.pathname.startsWith('/api'),
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-runtime-cache',
                  networkTimeoutSeconds: 10
                }
              }
            ],
            navigateFallback: '/index.html',
            cleanupOutdatedCaches: true
          },
          injectManifest: {
            globPatterns: ['**/*.{js,css,html,svg,png,ico,json,txt,woff,woff2}'],
            globIgnores: ['**/node_modules/**/*'],
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB
          }
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
