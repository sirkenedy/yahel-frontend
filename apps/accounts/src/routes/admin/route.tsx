import { Outlet, createFileRoute, redirect, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { AdminFlowProvider } from '../../features/admin/admin-flow';
import { stepOfPath, stepPath } from '../../features/admin/machine';
import { forgetAdmin, isOffered, loadAdminFacts, receiveHandover } from '../../features/admin/route-guard';
import { handoverOf } from '../../features/business/route-guard';
import { AppFrame } from '../../features/chrome/app-frame';
import { chromeMessages } from '../../features/chrome/messages';
import { useSignedInAccount } from '../../flow/use-signed-in-account';
import { PageRouteError } from '../../route-error';

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    // Not offered in this build (F-80): a new administrator signs in through sign-in, which takes the emailed code too.
    if (!isOffered(context)) throw redirect({ to: '/signin', replace: true });
    // Arriving from workspace sign-up's Ready screen: the address it just made is signed in to, not asked for.
    receiveHandover(context.admin, handoverOf(context.business));
    const facts = await loadAdminFacts(context);
    // Someone signed in who administers no workspace has nothing to set up here; sign-in says who is signed in.
    if (facts.signedIn && !facts.administrator) throw redirect({ to: '/signin', replace: true });
    return { facts };
  },
  // Leaving the flow forgets the address, the proof and every answer.
  onLeave: ({ context }) => forgetAdmin(context.admin),
  component: AdminLayout,
  errorComponent: PageRouteError,
});

function AdminLayout() {
  const { session, registrar, admin, config, facts } = Route.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();
  const step = stepOfPath(useLocation({ select: (location) => location.pathname })) ?? 'signin';
  const account = useSignedInAccount(session);
  const [detailsHidden, setDetailsHidden] = useState(false);

  return (
    <AppFrame
      links={{ home: '/admin', homeLabel: chromeMessages.brandAdminSignIn, help: config.helpUrl, privacy: config.privacyUrl, terms: config.termsUrl }}
      privacy={step === 'phone' ? { isOn: detailsHidden, onToggle: () => setDetailsHidden(!detailsHidden) } : null}
      account={account}
    >
      <AdminFlowProvider
        step={step}
        session={session}
        registrar={registrar}
        store={admin}
        facts={facts}
        organisation={facts.organisation}
        passkeyRequired={facts.passkeyRequired}
        links={{ admin: config.adminUrl, signIn: config.signInUrl, resetPassword: config.signInUrl, help: config.helpUrl, businessTerms: config.businessTermsUrl, privacy: config.privacyUrl }}
        navigate={(to, options) => void navigate({ to: stepPath(to), replace: options?.replace })}
        isShown={(to) => stepOfPath(router.latestLocation.pathname) === to}
        leave={() => window.location.assign(config.adminUrl)}
      >
        <Outlet />
      </AdminFlowProvider>
    </AppFrame>
  );
}
