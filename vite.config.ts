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
    // Manual chunks caused a circular vendor ↔ ui dependency that silently
    // broke React initialization. Let Vite split automatically instead.
    chunkSizeWarningLimit: 2200,
  },
});
