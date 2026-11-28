import { createFileRoute } from '@tanstack/react-router';
import { consoleMessages } from '../../../../features/console/messages';
import { crumbsOf } from '../../../../features/console/nav-tree';
import { AddPeoplePage } from '../../../../features/users/add-people-page';

export const Route = createFileRoute('/u/$slot/_console/users/add')({ component: AddPeople });

function AddPeople() {
  const { session, workspace } = Route.useRouteContext();
  const { slot } = Route.useParams();
  return <AddPeoplePage session={session} tenantId={workspace.tenantId} slot={slot} crumbs={crumbsOf(slot, 'users')} crumbsLabel={consoleMessages.crumbs} />;
}
