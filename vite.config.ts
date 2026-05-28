import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR disabled to prevent flickering during agent edits.
    hmr: false,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Keep all React-related libs in one chunk to avoid circular chunk
        // dependencies (vendor ↔ ui) caused by motion/react needing react-dom.
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'motion'],
          ui: ['recharts', 'lucide-react'],
          astro: ['astronomy-engine', 'suncalc'],
        },
      },
    },
  },
});
