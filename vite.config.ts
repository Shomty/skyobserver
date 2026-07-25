import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vitest/config';

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
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 2200,
    rollupOptions: {
      output: {
        // Only split true node_modules packages — never src/ files.
        // Keeping app code out of manual chunks prevents the circular
        // vendor ↔ ui dependency that broke React init in commit 9e08eae.
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router')) return 'vendor-react';
          if (id.includes('node_modules/motion/') || id.includes('node_modules/framer-motion/')) return 'vendor-motion';
          if (id.includes('node_modules/firebase/')) return 'vendor-firebase';
          if (id.includes('node_modules/recharts/')) return 'vendor-charts';
          if (id.includes('node_modules/astronomy-engine/')) return 'vendor-astro';
          if (id.includes('node_modules/@google/')) return 'vendor-ai';
        },
      },
    },
  },
});
