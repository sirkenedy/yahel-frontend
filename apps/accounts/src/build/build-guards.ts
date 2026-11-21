/**
 * Stops a build that would ship stand-in data by accident. Stand-ins are for development and the browser
 * tests; a build may include them only when it also says, explicitly, that it is a demo build.
 */
export function assertStandInsAllowed(command: 'build' | 'serve', env: Record<string, string | undefined>) {
  if (command !== 'build' || env.VITE_STAND_INS !== 'on') return;
  if (env.VITE_STAND_INS_ALLOW_BUILD === 'demo') return;
  throw new Error(
    'VITE_STAND_INS=on would put stand-in data into this build. Unset it for a real build. For a demo build that is never deployed to people, also set VITE_STAND_INS_ALLOW_BUILD=demo.',
  );
}

const isSecureAddress = (value: string | undefined) => {
  try {
    return new URL(value ?? '').protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Stops a build that would send people's sign-in to a development address. The app falls back to
 * `localhost` when an address is not set, which is right on a developer's machine and never right in a
 * release. A release build must name the backend and the app, both over https. Two kinds of build are
 * let through because they are never released: the demo build, and one that says it is local.
 */
export function assertReleaseAddresses(command: 'build' | 'serve', env: Record<string, string | undefined>) {
  if (command !== 'build' || env.VITE_STAND_INS_ALLOW_BUILD === 'demo' || env.VITE_LOCAL_BUILD === 'local') return;
  const wrong = ['VITE_API_URL', 'VITE_APP_URL'].filter((name) => !isSecureAddress(env[name]));
  if (wrong.length === 0) return;
  throw new Error(
    `${wrong.join(' and ')} must be set to an https address for a release build. For a build that will only run on this machine (tests, bundle checks), set VITE_LOCAL_BUILD=local; \`pnpm build\` does.`,
  );
}
