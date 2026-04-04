import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

export default defineConfig({
  plugins: [react(), checker({ typescript: true })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@repo/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  css: {
    postcss: path.resolve(__dirname, './postcss.config.mjs'),
  },
});
