import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { assertReleaseAddresses, assertStandInsAllowed } from './src/build/build-guards.ts';

const envDir = '../..';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, envDir, 'VITE_');
  assertStandInsAllowed(command, env);
  assertReleaseAddresses(command, env);
  return {
    envDir,
    plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
    server: { port: 5175, strictPort: true },
    build: { sourcemap: true, target: 'es2022' },
  };
});
