import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { stepPath as adminStepPath } from '../../features/admin/machine';
import { BusinessFlowProvider } from '../../features/business/business-flow';
import { stepOfPath, stepPath } from '../../features/business/machine';
import { businessFacts, forgetWorkspace, isOffered, prefillFromAccount } from '../../features/business/route-guard';
import { AppFrame } from '../../features/chrome/app-frame';
import { chromeMessages } from '../../features/chrome/messages';
import { useAccountMenu } from '../../features/chrome/use-account-menu';
import { PageRouteError } from '../../route-error';

// The screens that ask for nothing personal, or show nothing that was typed.
const withoutDetails = ['domain-question', 'found', 'plan', 'creating', 'ready', 'paid'];
// The steps after the phone check, where the new administrator is the account in use. Before it, the questions
// belong to the account being made, not to whoever this tab is signed in as.
const signedInSteps = ['plan', 'checkout', 'gateway', 'card-code', 'paid'];

export const Route = createFileRoute('/business')({
  beforeLoad: async ({ context }) => {
    // Not offered in this build (F-78): the personal sign-up's first question says so.
    if (!isOffered(context)) throw redirect({ to: '/personal', replace: true });
    // Open whether or not this tab is signed in: a workspace is one more account for this browser (F-94). From a
    // personal account, its name and address fill the empty fields (F-95).
    await prefillFromAccount(context);
    return { facts: businessFacts(context) };
  },
  // Leaving sign-up forgets what was answered and the password with it, unless the workspace exists: the phone check
  // and the welcome happen in Admin's first steps, which hand back to the plan and checkout.
  onLeave: ({ context }) => forgetWorkspace(context.business, { unlessUnderway: true }),
  component: BusinessLayout,
  errorComponent: PageRouteError,
});

function BusinessLayout() {
  const { session, capabilities, business, signIn, config, facts } = Route.useRouteContext();
  const navigate = useNavigate();
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
  const step = stepOfPath(useLocation({ select: (location) => location.pathname })) ?? 'start';
  const [detailsHidden, setDetailsHidden] = useState(false);

  return (
    <AppFrame
      links={{ home: '/business', homeLabel: chromeMessages.brandBusinessSignUp, signIn: step === 'start' ? config.signInUrl : null, help: config.helpUrl, privacy: config.privacyUrl, terms: config.termsUrl }}
      privacy={withoutDetails.includes(step) ? null : { isOn: detailsHidden, onToggle: () => setDetailsHidden(!detailsHidden) }}
      menu={signedInSteps.includes(step) ? menu : null}
    >
      <BusinessFlowProvider
        step={step}
        session={session}
        capabilities={capabilities}
        store={business}
        facts={facts}
        links={{ signIn: config.signInUrl, personal: config.signUpUrl, help: config.helpUrl, businessTerms: config.businessTermsUrl, trialTerms: config.trialTermsUrl, domainTerms: config.domainTermsUrl }}
        navigate={(to, options) => void navigate({ to: stepPath(to), replace: options?.replace })}
        checkPhone={() => void navigate({ to: adminStepPath('phone') })}
        goToAdmin={() => void navigate({ to: adminStepPath('add-passkey') })}
      >
        <Outlet />
      </BusinessFlowProvider>
    </AppFrame>
  );
}
