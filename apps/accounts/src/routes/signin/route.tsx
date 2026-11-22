import { Outlet, createFileRoute, useLocation, useNavigate } from '@tanstack/react-router';
import { resolveReturnAddress } from '@yahel/auth';
import { AppFrame } from '../../features/chrome/app-frame';
import { PageRouteError } from '../../route-error';
import { stepOfPath, stepPath } from '../../features/sign-in/machine';
import { loadSignInFacts } from '../../features/sign-in/route-guard';
import { SignInFlowProvider } from '../../features/sign-in/sign-in-flow';

export const Route = createFileRoute('/signin')({
  beforeLoad: async ({ context }) => ({ facts: await loadSignInFacts(context) }),
  component: SignInLayout,
  errorComponent: PageRouteError,
});

function SignInLayout() {
  const { session, capabilities, passkeys, signIn, config } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const step = stepOfPath(useLocation({ select: (location) => location.pathname })) ?? 'email';
  const entry = step === 'choose' || step === 'email';

  return (
    <AppFrame links={{ home: '/signin', signUp: entry ? config.signUpUrl : null, help: config.helpUrl, privacy: config.privacyUrl, terms: config.termsUrl }}>
      <SignInFlowProvider
        step={step}
        session={session}
        capabilities={capabilities}
        passkeys={passkeys}
        store={signIn}
        navigate={(to, options) => void navigate({ to: stepPath(to), replace: options?.replace })}
        leave={() => window.location.assign(resolveReturnAddress(search.return, config.returnPolicy))}
      >
        <Outlet />
      </SignInFlowProvider>
    </AppFrame>
  );
}
