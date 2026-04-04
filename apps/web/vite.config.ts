import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@repo/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  css: {
    postcss: path.resolve(__dirname, './postcss.config.mjs'),
  },
});
