import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    preserveSymlinks: true,
  },
  optimizeDeps: {
    include: [
      '@suite/shared',
      '@suite/ui',
    ],
    // IMPORTANTE: Excluir Prisma del pre-bundling
    exclude: [
      '@prisma/client',
      '@suite/database',
    ],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // IMPORTANTE: Marcar Prisma como external (no bundlear)
      external: [
        '@prisma/client',
        '.prisma/client',
        '@suite/database',
      ],
      output: {
        interop: 'auto',
      },
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  // IMPORTANTE: Definir variables de entorno
  define: {
    'process.env': {},
  },
});