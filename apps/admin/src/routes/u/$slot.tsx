import { Outlet, createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { enterConsole } from '../../features/console/access';
import { ConsoleError, ConsoleFrame } from '../../features/console/console-frame';

export const Route = createFileRoute('/u/$slot')({
  // Signed out, or not an administrator: back to the accounts app, which asks for an administrator account.
  beforeLoad: async ({ context, params }) => {
    const entry = await enterConsole(context, params.slot);
    if (entry.to === 'slot') throw redirect({ to: '/u/$slot', params: { slot: String(entry.slot) }, replace: true });
    if (entry.to === 'accounts') throw redirect({ href: entry.href });
    return { workspace: entry.workspace };
  },
  component: ConsoleLayout,
  errorComponent: ConsoleFailed,
});

function ConsoleLayout() {
  const { session, accountsApp, config, workspace } = Route.useRouteContext();
  const { slot } = Route.useParams();
  return (
    <ConsoleFrame session={session} accountsApp={accountsApp} appHome={config.appHome} workspace={workspace} slot={slot}>
      <Outlet />
    </ConsoleFrame>
  );
}

function ConsoleFailed() {
  const router = useRouter();
  return <ConsoleError onRetry={() => void router.invalidate()} />;
}
