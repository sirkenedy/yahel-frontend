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
    build: {
      sourcemap: true,
      target: 'es2022',
      // Each flow's screens travel as one file. They are small and shown one after another, so a file per
      // screen costs more to compress and to fetch than it saves; the entry still contains none of them.
      rolldownOptions: {
        output: {
          codeSplitting: {
            // Only the screens themselves: what they share with the entry stays where it is.
            includeDependenciesRecursively: false,
            groups: [
              { name: 'sign-in-steps', test: /features\/sign-in\/steps\/|routes\/signin\/.*tsr-split=component/ },
              { name: 'personal-steps', test: /features\/personal\/steps\/|routes\/personal\/.*tsr-split=component/ },
              // What only steps are built from, the whole-screen states among them: one file beside the first flow shown, not a dozen.
              { name: 'step-kit', test: /src\/flow\/(step-frame|state-screen|resend-link|use-step-field|credentials|use-debounced-value)|ui\/src\/components\/flow\/(flow-field|code-input|choice|flow-select|progress|suggestions)\./ },
            ],
          },
        },
      },
    },
  };
});
