import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';

export const ProjectJsonPath = path.resolve(
  __dirname,
  'src',
  'api',
  'projects.json'
);

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    eslint({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      emitWarning: true,
      emitError: false, // error doesn't block compilation
      failOnWarning: false,
      failOnError: false, // error doesn't block compilation
    }),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, './src/api'),
    },
  },
  base: '/f1-stats/',
});
