import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vitest/config';

function injectSeoEnv(): Plugin {
  const siteUrl = (process.env.VITE_SITE_URL ?? 'https://thesoulblueprint.online').replace(/\/$/, '');
  const gaId = process.env.VITE_GA_MEASUREMENT_ID ?? 'G-FSFQ96MPGT';
  const gtmId = process.env.VITE_GTM_ID ?? 'GTM-PN7TR3J7';
  const gsc = process.env.VITE_GSC_VERIFICATION ?? '';

  return {
    name: 'inject-seo-env',
    transformIndexHtml(html) {
      let out = html
        .replaceAll('__SITE_URL__', siteUrl)
        .replaceAll('__GA_MEASUREMENT_ID__', gaId)
        .replaceAll('__GTM_ID__', gtmId);

      const gscTag = gsc
        ? `<meta name="google-site-verification" content="${gsc}" />`
        : '';
      return out.replace('<!-- gsc-verification -->', gscTag);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), injectSeoEnv()],
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
