export interface DeploymentFacts {
  /** `import.meta.env.PROD`: the bundle was built, not served by the development server. */
  isProductionBuild: boolean;
  /** The host the page is being served from. */
  hostname: string;
  /** The settings as built in, before any development fallback is applied. */
  apiUrl: string | undefined;
  appUrl: string | undefined;
}

const LOCAL_HOSTS: readonly string[] = ['localhost', '127.0.0.1', '[::1]'];

const isSecureAddress = (value: string | undefined) => {
  try {
    return new URL(value ?? '').protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * What is wrong with where this bundle has ended up, or `null`. A built bundle served to people must name
 * the backend and the app over https; without that it would send their sign-in to a development address.
 * The build guard (`build/build-guards.ts`) stops most such builds; this stops one that was built for a
 * developer's machine or as a demo and then deployed anyway.
 */
export function deploymentProblem({ isProductionBuild, hostname, apiUrl, appUrl }: DeploymentFacts): string | null {
  if (!isProductionBuild || LOCAL_HOSTS.includes(hostname)) return null;
  const wrong = [
    ['VITE_API_URL', apiUrl],
    ['VITE_APP_URL', appUrl],
  ].flatMap(([name, value]) => (isSecureAddress(value) ? [] : [name]));
  if (wrong.length === 0) return null;
  return `Yahel accounts was built without ${wrong.join(' and ')} set to an https address, and is being served from ${hostname}. It will not start: sign-in would be sent to a development address. Rebuild with \`pnpm --filter @yahel/accounts build:release\` and the deployment's addresses.`;
}

/** Refuses to start a misbuilt deployment: says why in the console and throws, before anything is rendered or requested. */
export function assertDeployment(facts: DeploymentFacts, report: (message: string) => void = console.error) {
  const problem = deploymentProblem(facts);
  if (!problem) return;
  report(problem);
  throw new Error(problem);
}
