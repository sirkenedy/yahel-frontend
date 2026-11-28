import { createFileRoute } from '@tanstack/react-router';
import { consoleMessages } from '../../../../features/console/messages';
import { crumbsOf } from '../../../../features/console/nav-tree';
import { DomainsPage } from '../../../../features/workspace/domains-page';

export const Route = createFileRoute('/u/$slot/_console/domains')({ component: Domains });

function Domains() {
  const { session, workspace } = Route.useRouteContext();
  const { slot } = Route.useParams();
  return <DomainsPage session={session} tenantId={workspace.tenantId} slot={slot} crumbs={crumbsOf(slot, 'domManage')} crumbsLabel={consoleMessages.crumbs} />;
}
