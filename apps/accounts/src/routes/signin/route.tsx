import { Outlet, createFileRoute, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { AppFrame } from '../../features/chrome/app-frame';
import { useAccountMenu } from '../../features/chrome/use-account-menu';
import { PageRouteError } from '../../route-error';
import { stepOfPath, stepPath } from '../../features/sign-in/machine';
import { dropProof, loadSignInFacts, validateSignInSearch } from '../../features/sign-in/route-guard';
import { SignInFlowProvider } from '../../features/sign-in/sign-in-flow';

export const Route = createFileRoute('/signin')({
  validateSearch: validateSignInSearch,
  beforeLoad: async ({ context }) => ({ facts: await loadSignInFacts(context) }),
  // A proof stored as sign-in was left must not outlive it.
  onLeave: ({ context }) => dropProof(context.signIn),
  component: SignInLayout,
  errorComponent: PageRouteError,
});

function SignInLayout() {
  const { session, capabilities, passkeys, signIn, config } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const step = stepOfPath(useLocation({ select: (location) => location.pathname })) ?? 'email';
  const entry = step === 'choose' || step === 'email';
  const toStep = (to: Parameters<typeof stepPath>[0], options?: { replace?: boolean }) => void navigate({ to: stepPath(to), replace: options?.replace });
  const menu = useAccountMenu({
    session,
    directory: capabilities.directory,
    manageUrl: config.accountSettings,
    privacyUrl: config.privacyUrl,
    termsUrl: config.termsUrl,
    go: {
      signIn: (email) => {
        signIn.dispatch(email ? { type: 'account-chosen', email } : { type: 'another-account-wanted' });
        toStep(email ? 'password' : 'email');
      },
      done: () => toStep('done'),
      chooser: () => {
        signIn.dispatch({ type: 'signed-out' });
        toStep('choose', { replace: true });
      },
    },
  });

  return (
    <AppFrame links={{ home: '/signin', signUp: entry ? config.signUpUrl : null, help: config.helpUrl, privacy: config.privacyUrl, terms: config.termsUrl }} menu={step === 'done' ? menu : null}>
      <SignInFlowProvider
        step={step}
        session={session}
        capabilities={capabilities}
        passkeys={passkeys}
        store={signIn}
        navigate={toStep}
        isShown={(to) => stepOfPath(router.latestLocation.pathname) === to}
        // The app opens as the account just signed in to: its slot is in the address.
        leave={() => window.location.assign(config.afterSignIn(search.return, session.store.getState().slot ?? 0))}
        // Sent here by the app (or another allowed address): it goes straight back once signed in, with no Done to press.
        returning={search.return !== undefined}
        links={{ signUp: config.signUpUrl, help: config.helpUrl }}
      >
        <Outlet />
      </SignInFlowProvider>
    </AppFrame>
  );
}
