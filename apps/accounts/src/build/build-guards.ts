import { isMailDomain, isSecureAddress } from './addresses.ts';

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

/**
 * Stops a build that would send people's sign-in to a development address. The app falls back to
 * `localhost` when an address is not set, which is right on a developer's machine and never right in a
 * release. A release build must name the backend and the app, both over https. Two kinds of build are
 * let through because they are never released: the demo build, and one that says it is local. A demo
 * build is one with stand-ins on as well as the demo opt-in: the opt-in alone, left behind in a
 * deployment's settings, exempts nothing.
 */
export function assertReleaseAddresses(command: 'build' | 'serve', env: Record<string, string | undefined>) {
  const isDemoBuild = env.VITE_STAND_INS === 'on' && env.VITE_STAND_INS_ALLOW_BUILD === 'demo';
  if (command !== 'build' || isDemoBuild || env.VITE_LOCAL_BUILD === 'local') return;
  const wrong = ['VITE_API_URL', 'VITE_APP_URL'].filter((name) => !isSecureAddress(env[name]));
  if (wrong.length > 0) {
    throw new Error(
      `${wrong.join(' and ')} must be set to an https address for a release build. For a build that will only run on this machine (tests, bundle checks), set VITE_LOCAL_BUILD=local; \`pnpm build\` does.`,
    );
  }
  // These three have a place inside this app when unset; set, they lead people elsewhere and must do so safely.
  const insecure = ['VITE_SIGN_IN_URL', 'VITE_SIGN_UP_URL', 'VITE_BUSINESS_SIGN_UP_URL'].filter((name) => env[name] && !isSecureAddress(env[name]));
  if (insecure.length > 0) throw new Error(`${insecure.join(' and ')} must be an https address in a release build, or left unset.`);
  // The domain of every new Yahel address. A wrong one breaks every sign-up, so a release has to say it.
  if (!isMailDomain(env.VITE_MAIL_DOMAIN)) throw new Error('VITE_MAIL_DOMAIN must be set to the mail domain of new Yahel addresses (for example yahel.com) for a release build. It must match the backend.');
}
