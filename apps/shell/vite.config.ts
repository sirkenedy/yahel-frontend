import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { assertReleaseAddresses } from './src/build/build-guards.ts';

export default defineConfig(({ command, mode }) => {
  assertReleaseAddresses(command, loadEnv(mode, process.cwd(), 'VITE_'));
  return {
    plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
    server: { port: 5173, strictPort: true },
    build: { sourcemap: true, target: 'es2022' },
  };
});
