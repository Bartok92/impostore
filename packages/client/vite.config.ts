import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Percorsi relativi: la stessa build funziona alla radice e in una sottocartella (GitHub Pages).
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    // App installabile: icona sul telefono, schermo intero, e si apre anche con rete debole.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icona.svg'],
      manifest: {
        name: 'Impostore',
        short_name: 'Impostore',
        description: 'Tutti hanno la stessa parola. Quasi tutti. Il Master crea la stanza, gli amici entrano con il QR.',
        lang: 'it',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#110E1F',
        theme_color: '#110E1F',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: {
    host: true,
    port: 5174,
  },
});
