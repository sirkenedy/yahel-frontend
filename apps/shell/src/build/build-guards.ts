const isSecureAddress = (value: string | undefined) => {
  if (!value) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Stops a release build that would send people to sign in at a development address. Unset, the accounts
 * app's address falls back to this machine, which is right for development and never for a release. A build
 * that says it is local (`pnpm build`, for tests and the bundle check) is let through.
 */
export function assertReleaseAddresses(command: 'build' | 'serve', env: Record<string, string | undefined>) {
  if (command !== 'build' || env.VITE_LOCAL_BUILD === 'local') return;
  const wrong = ['VITE_API_URL', 'VITE_ACCOUNTS_URL'].filter((name) => !isSecureAddress(env[name]));
  if (wrong.length > 0) {
    throw new Error(`${wrong.join(' and ')} must be set to an https address for a release build. For a build that will only run on this machine (tests, bundle checks), set VITE_LOCAL_BUILD=local; \`pnpm build\` does.`);
  }
}
