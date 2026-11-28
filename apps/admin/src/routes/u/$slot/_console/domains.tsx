import { createFileRoute } from '@tanstack/react-router';
import { DomainsPage } from '../../../../features/workspace/domains-page';

export const Route = createFileRoute('/u/$slot/_console/domains')({ component: Domains });

function Domains() {
  const { session, workspace } = Route.useRouteContext();
  return <DomainsPage session={session} tenantId={workspace.tenantId} />;
}
