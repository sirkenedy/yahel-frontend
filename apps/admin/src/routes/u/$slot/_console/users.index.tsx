import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { consoleMessages } from '../../../../features/console/messages';
import { crumbsOf } from '../../../../features/console/nav-tree';
import { statusFilters } from '../../../../features/users/people';
import type { StatusFilter } from '../../../../features/users/people';
import { UsersPage } from '../../../../features/users/users-page';

interface UsersSearch {
  q?: string;
  status?: StatusFilter;
}

const isFilter = (value: unknown): value is StatusFilter => typeof value === 'string' && (statusFilters as readonly string[]).includes(value);

export const Route = createFileRoute('/u/$slot/_console/users/')({
  validateSearch: (search: Record<string, unknown>): UsersSearch => ({
    q: typeof search.q === 'string' && search.q ? search.q : undefined,
    status: isFilter(search.status) && search.status !== 'all' ? search.status : undefined,
  }),
  component: Users,
});

function Users() {
  const { session, workspace } = Route.useRouteContext();
  const { slot } = Route.useParams();
  const { q, status } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <UsersPage
      session={session}
      tenantId={workspace.tenantId}
      organisation={workspace.name}
      slot={slot}
      crumbs={crumbsOf(slot, 'users')}
      crumbsLabel={consoleMessages.crumbs}
      search={{ q: q ?? '', status: status ?? 'all' }}
      onSearch={(next) => void navigate({ search: { q: next.q || undefined, status: next.status === 'all' ? undefined : next.status }, replace: true })}
    />
  );
}
