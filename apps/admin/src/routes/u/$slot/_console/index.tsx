import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '../../../../features/workspace/home-page';

export const Route = createFileRoute('/u/$slot/_console/')({ component: Home });

function Home() {
  const { session, workspace } = Route.useRouteContext();
  const { slot } = Route.useParams();
  return <HomePage session={session} tenantId={workspace.tenantId} name={workspace.name} slot={slot} />;
}
