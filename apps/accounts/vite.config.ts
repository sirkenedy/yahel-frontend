import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { assertStandInsAllowed } from './src/build/stand-in-guard.ts';

const envDir = '../..';

export default defineConfig(({ command, mode }) => {
  assertStandInsAllowed(command, loadEnv(mode, envDir, 'VITE_'));
  return {
    envDir,
    plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
    server: { port: 5175, strictPort: true },
    build: { sourcemap: true, target: 'es2022' },
  };
});
