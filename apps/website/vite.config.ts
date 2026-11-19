import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { resolveAppUrl } from './src/app-url.ts';

// Variables live in the repository's root .env, beside .env.example, for every app.
const envDir = '../..';

export default defineConfig(({ mode }) => {
  // A malformed address stops the build. Whether a missing or plain-http one is acceptable depends on where
  // the build is served, so that is settled when the site starts (src/config.ts).
  resolveAppUrl(loadEnv(mode, envDir, 'VITE_').VITE_APP_URL, { production: false, siteHost: 'localhost' });
  return {
    envDir,
    plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
    server: { port: 5174, strictPort: true },
    build: { sourcemap: true, target: 'es2022' },
  };
});
