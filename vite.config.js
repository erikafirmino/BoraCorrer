import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/192.png', 'icons/512.png'],
            workbox: {
                // Não intercepta tiles do OSM nem CDN do Leaflet
                navigateFallbackDenylist: [/^\/api/, /openstreetmap/, /cdnjs/],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'osm-tiles',
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 7
                            }
                        }
                    }
                ]
            },
            manifest: {
                name: 'BoraCorrer - Corrida para Iniciantes',
                short_name: 'BoraCorrer',
                description: 'Aplicativo de corrida intervalada para iniciantes',
                theme_color: '#0f172a',
                background_color: '#0f172a',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                icons: [
                    {
                        src: 'icons/192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'icons/512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    server: {
        port: 5173
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
                    leaflet: ['leaflet']
                }
            }
        }
    }
});
