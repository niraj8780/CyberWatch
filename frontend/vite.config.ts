import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, _res) => {
            // Suppress noisy abort logs on client disconnect/HMR reload
            if ((err as any).code === 'ECONNABORTED' || (err as any).code === 'ECONNRESET' || (err as any).code === 'ECONNREFUSED') {
              return;
            }
            console.error('[vite proxy error]', err);
          });
        },
      },
      '/ws': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, _res) => {
            if ((err as any).code === 'ECONNABORTED' || (err as any).code === 'ECONNRESET' || (err as any).code === 'ECONNREFUSED') {
              return;
            }
            console.error('[vite ws proxy error]', err);
          });
        },
      },
    },
  },
});
