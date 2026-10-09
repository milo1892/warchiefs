import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Warchiefs',
        short_name: 'Warchiefs',
        description: 'Offline turn-based conquest with local saves.',
        theme_color: '#172b28',
        background_color: '#101f1d',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'], navigateFallback: 'index.html' },
    }),
  ],
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
