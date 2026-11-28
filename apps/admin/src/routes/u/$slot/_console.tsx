import { Outlet, createFileRoute } from '@tanstack/react-router';
import { ConsoleFrame } from '../../../features/console/console-frame';

export const Route = createFileRoute('/u/$slot/_console')({ component: ConsoleLayout });

function ConsoleLayout() {
  const { session, accountsApp, config, workspace } = Route.useRouteContext();
  const { slot } = Route.useParams();
  return (
    <ConsoleFrame session={session} accountsApp={accountsApp} links={config} workspace={workspace} slot={slot}>
      <Outlet />
    </ConsoleFrame>
  );
}
