import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { isOffered as isAdminSignInOffered } from '../../features/admin/route-guard';
import { stepPath as adminStepPath } from '../../features/admin/machine';
import { BusinessFlowProvider } from '../../features/business/business-flow';
import { stepOfPath, stepPath } from '../../features/business/machine';
import { businessFacts, forgetWorkspace, isOffered, isSignedIn } from '../../features/business/route-guard';
import { AppFrame } from '../../features/chrome/app-frame';
import { chromeMessages } from '../../features/chrome/messages';
import { PageRouteError } from '../../route-error';

// The screens that ask for nothing personal, or show nothing that was typed.
const withoutDetails = ['domain-question', 'plan', 'creating', 'ready'];

export const Route = createFileRoute('/business')({
  beforeLoad: ({ context }) => {
    // Not offered in this build (F-78): the personal sign-up's first question says so.
    if (!isOffered(context)) throw redirect({ to: '/personal', replace: true });
    if (isSignedIn(context)) throw redirect({ to: '/signin/done', replace: true });
    return { facts: businessFacts(context) };
  },
  // Leaving sign-up, for sign-in or anywhere else in the app, forgets what was answered and the password with it.
  onLeave: ({ context }) => forgetWorkspace(context.business),
  component: BusinessLayout,
  errorComponent: PageRouteError,
});

function BusinessLayout() {
  const { session, capabilities, business, config, facts } = Route.useRouteContext();
  // A new administrator signs in where Admin is set up, if this build offers that, and through sign-in otherwise (F-80).
  const adminSignIn = config.adminSignInUrl ?? (isAdminSignInOffered({ config, capabilities }) ? adminStepPath('signin') : config.signInUrl);
  const navigate = useNavigate();
  const step = stepOfPath(useLocation({ select: (location) => location.pathname })) ?? 'start';
  const [detailsHidden, setDetailsHidden] = useState(false);

  return (
    <AppFrame
      links={{ home: '/business', homeLabel: chromeMessages.brandBusinessSignUp, signIn: step === 'start' ? config.signInUrl : null, help: config.helpUrl, privacy: config.privacyUrl, terms: config.termsUrl }}
      privacy={withoutDetails.includes(step) ? null : { isOn: detailsHidden, onToggle: () => setDetailsHidden(!detailsHidden) }}
    >
      <BusinessFlowProvider
        step={step}
        session={session}
        capabilities={capabilities}
        store={business}
        facts={facts}
        links={{ signIn: config.signInUrl, adminSignIn, personal: config.signUpUrl, help: config.helpUrl, businessTerms: config.businessTermsUrl, trialTerms: config.trialTermsUrl, domainTerms: config.domainTermsUrl }}
        navigate={(to, options) => void navigate({ to: stepPath(to), replace: options?.replace })}
      >
        <Outlet />
      </BusinessFlowProvider>
    </AppFrame>
  );
}
