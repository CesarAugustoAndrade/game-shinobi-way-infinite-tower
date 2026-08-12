import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3010,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    // Surface large-chunk regressions early (initial JS target is << 1.1 MB).
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('\\react\\')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('@dnd-kit')) {
              return 'dnd';
            }
          }
          // Heavy pure content / sim paths stay out of the first paint bundle when lazy-imported.
          if (id.includes('/src/simulation/')) {
            return 'simulation';
          }
        },
      },
    },
  },
});
