import { createFileRoute } from '@tanstack/react-router';
import { consoleMessages } from '../../../../features/console/messages';
import { crumbsOf } from '../../../../features/console/nav-tree';
import { UserPage } from '../../../../features/users/user-page';

export const Route = createFileRoute('/u/$slot/_console/users/$memberId')({ component: User });

function User() {
  const { session, workspace } = Route.useRouteContext();
  const { slot, memberId } = Route.useParams();
  return (
    <UserPage
      session={session}
      tenantId={workspace.tenantId}
      memberId={memberId}
      slot={slot}
      crumbs={crumbsOf(slot, 'users')}
      crumbsLabel={consoleMessages.crumbs}
      organisation={workspace.name}
    />
  );
}
