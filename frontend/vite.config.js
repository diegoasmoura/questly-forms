import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootNodeModules = path.resolve(__dirname, "../node_modules");

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Questly Forms',
        short_name: 'Questly',
        description: 'Gestão Clínica para Psicólogos e Aplicação de Formulários',
        theme_color: '#0f172a',
        background_color: '#f1f5f9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
      includeAssets: ['favicon.png', 'logo-nobg.png', 'logo-icon.png'],
      manifest: {
        name: 'Questly Forms',
        short_name: 'Questly',
        description: 'Gestão Clínica e Formulários Inteligentes',
        theme_color: '#5CBF9D',
        background_color: '#FAF8F4',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/patients'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-patients-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
              },
              networkTimeoutSeconds: 5
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/forms'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-forms-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
              },
              networkTimeoutSeconds: 5
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/patients.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'patients-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              networkTimeoutSeconds: 5,
              backgroundSync: {
                name: 'patients-sync',
                options: {
                  maxRetentionTime: 24 * 60 // 24 horas em minutos
                }
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "react": path.resolve(rootNodeModules, "react"),
      "react-dom": path.resolve(rootNodeModules, "react-dom"),
      "react-router-dom": path.resolve(rootNodeModules, "react-router-dom"),
    },
  },
  server: {
    port: 3002,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
