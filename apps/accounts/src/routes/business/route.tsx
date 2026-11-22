import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { BusinessFlowProvider } from '../../features/business/business-flow';
import { stepOfPath, stepPath } from '../../features/business/machine';
import { businessFacts, forgetWorkspace, isSignedIn } from '../../features/business/route-guard';
import { AppFrame } from '../../features/chrome/app-frame';
import { chromeMessages } from '../../features/chrome/messages';
import { PageRouteError } from '../../route-error';

// The screens that ask for nothing personal, or show nothing that was typed.
const withoutDetails = ['domain-question', 'plan', 'creating', 'ready'];

export const Route = createFileRoute('/business')({
  beforeLoad: ({ context }) => {
    if (isSignedIn(context)) throw redirect({ to: '/signin', replace: true });
    return { facts: businessFacts(context) };
  },
  // Leaving sign-up, for sign-in or anywhere else in the app, forgets what was answered and the password with it.
  onLeave: ({ context }) => forgetWorkspace(context.business),
  component: BusinessLayout,
  errorComponent: PageRouteError,
});

function BusinessLayout() {
  const { session, capabilities, business, config, facts } = Route.useRouteContext();
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
        links={{ signIn: config.signInUrl, adminSignIn: config.adminSignInUrl, personal: config.signUpUrl, help: config.helpUrl, businessTerms: config.businessTermsUrl, trialTerms: config.trialTermsUrl, domainTerms: config.domainTermsUrl }}
        navigate={(to, options) => void navigate({ to: stepPath(to), replace: options?.replace })}
      >
        <Outlet />
      </BusinessFlowProvider>
    </AppFrame>
  );
}
