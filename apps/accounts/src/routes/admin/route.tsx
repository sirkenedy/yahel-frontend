import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { AdminFlowProvider } from '../../features/admin/admin-flow';
import { stepOfPath, stepPath } from '../../features/admin/machine';
import { forgetAdmin, isOffered, loadAdminFacts, receiveHandover } from '../../features/admin/route-guard';
import { handoverOf } from '../../features/business/route-guard';
import { stepPath as businessStepPath } from '../../features/business/machine';
import { AppFrame } from '../../features/chrome/app-frame';
import { chromeMessages } from '../../features/chrome/messages';
import { useAccountMenu } from '../../features/chrome/use-account-menu';
import { PageRouteError } from '../../route-error';

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    // Arriving from workspace sign-up's Ready screen: the address it just made, and the phone check it answered with.
    receiveHandover(context.admin, handoverOf(context.business, context.capabilities.workspaceBilling !== null));
    // Not offered in this build (F-78) and no phone check waiting: sign-in is where an administrator starts.
    if (!isOffered(context)) throw redirect({ to: '/signin', replace: true });
    const facts = await loadAdminFacts(context);
    // Someone signed in who administers no workspace has nothing to set up here; sign-in says who is signed in.
    if (facts.signedIn && !facts.administrator) throw redirect({ to: '/signin', replace: true });
    return { facts };
  },
  // Leaving before signing in forgets the address and the phone check; once signed in, sign-up comes back for the passkey.
  onLeave: ({ context }) => forgetAdmin(context.admin, context.session),
  component: AdminLayout,
  errorComponent: PageRouteError,
});

function AdminLayout() {
  const { session, capabilities, registrar, admin, signIn, config, facts } = Route.useRouteContext();
  const navigate = useNavigate();
  const step = stepOfPath(useLocation({ select: (location) => location.pathname })) ?? 'phone';
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
  const [detailsHidden, setDetailsHidden] = useState(false);

  return (
    <AppFrame
      links={{ home: '/admin', homeLabel: chromeMessages.brandAdminSignIn, help: config.helpUrl, privacy: config.privacyUrl, terms: config.termsUrl }}
      privacy={step === 'phone' ? { isOn: detailsHidden, onToggle: () => setDetailsHidden(!detailsHidden) } : null}
      menu={menu}
    >
      <AdminFlowProvider
        step={step}
        session={session}
        registrar={registrar}
        store={admin}
        facts={facts}
        organisation={facts.organisation}
        links={{ admin: config.adminUrl, plan: businessStepPath('plan'), signIn: config.signInUrl, resetPassword: config.signInUrl, help: config.helpUrl, businessTerms: config.businessTermsUrl, privacy: config.privacyUrl }}
        navigate={(to, options) => void navigate({ to: stepPath(to), replace: options?.replace })}
        goTo={(href) => (href.startsWith('/') ? void navigate({ href }) : window.location.assign(href))}
        leave={() => window.location.assign(config.adminHome(session.store.getState().slot ?? 0))}
      >
        <Outlet />
      </AdminFlowProvider>
    </AppFrame>
  );
}
