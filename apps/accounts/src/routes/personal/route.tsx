import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { AppFrame } from '../../features/chrome/app-frame';
import { chromeMessages } from '../../features/chrome/messages';
import { useAccountMenu } from '../../features/chrome/use-account-menu';
import { PageRouteError } from '../../route-error';
import { progressOf, stepOfPath, stepPath } from '../../features/personal/machine';
import { PersonalFlowProvider } from '../../features/personal/personal-flow';
import { forgetSignUp, isFinishedElsewhere, personalFacts } from '../../features/personal/route-guard';

export const Route = createFileRoute('/personal')({
  // Open whether or not this tab is signed in: creating an account is one more way to add one to this browser (F-94).
  beforeLoad: ({ context, location }) => {
    const step = stepOfPath(location.pathname);
    if (step && isFinishedElsewhere(step, context)) throw redirect({ to: '/signin/done', replace: true });
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
        // The account just made opens as itself: a return to the app's home becomes that account's home.
        leave={() => window.location.assign(config.afterSignIn(search.return, session.store.getState().slot ?? 0))}
      >
        <Outlet />
      </PersonalFlowProvider>
    </AppFrame>
  );
}
