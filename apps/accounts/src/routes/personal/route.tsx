import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from '@tanstack/react-router';
import { resolveReturnAddress } from '@yahel/auth';
import { useState } from 'react';
import { AppFrame } from '../../features/chrome/app-frame';
import { chromeMessages } from '../../features/chrome/messages';
import { useAccountMenu } from '../../features/chrome/use-account-menu';
import { PageRouteError } from '../../route-error';
import { progressOf, stepOfPath, stepPath } from '../../features/personal/machine';
import { PersonalFlowProvider } from '../../features/personal/personal-flow';
import { forgetSignUp, isSignedInElsewhere, personalFacts } from '../../features/personal/route-guard';

export const Route = createFileRoute('/personal')({
  beforeLoad: ({ context }) => {
    if (isSignedInElsewhere(context)) throw redirect({ to: '/signin', replace: true });
    return { facts: personalFacts(context) };
  },
  // Leaving sign-up, for sign-in or anywhere else in the app, forgets what was answered and the password with it.
  onLeave: ({ context }) => forgetSignUp(context.personal),
  component: PersonalLayout,
  errorComponent: PageRouteError,
});

function PersonalLayout() {
  const { session, capabilities, registrar, personal, signIn, config } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const step = stepOfPath(useLocation({ select: (location) => location.pathname })) ?? 'type';
  const [detailsHidden, setDetailsHidden] = useState(false);
  const { businessSignUpUrl } = config;
  const menu = useAccountMenu({
    session,
    directory: capabilities.directory,
    manageUrl: config.accountSettings,
    privacyUrl: config.privacyUrl,
    termsUrl: config.termsUrl,
    go: {
      signIn: (email) => {
        signIn.dispatch(email ? { type: 'account-chosen', email } : { type: 'another-account-wanted' });
        void navigate({ to: email ? '/signin/password' : '/signin/email' });
      },
      done: () => void navigate({ to: '/signin/done' }),
      chooser: () => {
        signIn.dispatch({ type: 'signed-out' });
        void navigate({ to: '/signin/choose', replace: true });
      },
    },
  });

  return (
    <AppFrame
      links={{ home: '/personal', homeLabel: chromeMessages.brandSignUp, signIn: step === 'type' ? config.signInUrl : null, help: config.helpUrl, privacy: config.privacyUrl, terms: config.termsUrl }}
      menu={menu}
      // Offered on the numbered questions, which are the ones that ask for personal details.
      privacy={progressOf(step) ? { isOn: detailsHidden, onToggle: () => setDetailsHidden(!detailsHidden) } : null}
    >
      <PersonalFlowProvider
        step={step}
        session={session}
        capabilities={capabilities}
        registrar={registrar}
        store={personal}
        mailDomain={config.mailDomain}
        links={{ signIn: config.signInUrl, terms: config.termsUrl, privacy: config.privacyUrl, help: config.helpUrl }}
        navigate={(to, options) => void navigate({ to: stepPath(to), replace: options?.replace })}
        // A path is a step of this app; an address is the workspace sign-up served somewhere else.
        leaveForBusiness={businessSignUpUrl === null ? null : () => (businessSignUpUrl.startsWith('/') ? void navigate({ href: businessSignUpUrl }) : window.location.assign(businessSignUpUrl))}
        leave={() => window.location.assign(resolveReturnAddress(search.return, { ...config.returnPolicy, fallback: config.appHome(session.store.getState().slot ?? 0) }))}
      >
        <Outlet />
      </PersonalFlowProvider>
    </AppFrame>
  );
}
