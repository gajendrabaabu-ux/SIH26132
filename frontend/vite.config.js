import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AgriLink360',
        short_name: 'AgriLink360',
        theme_color: '#1b5e20',
        display: 'standalone',
      },
    }),
  ],
  server: { port: 5173 },
});
