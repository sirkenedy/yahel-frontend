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
