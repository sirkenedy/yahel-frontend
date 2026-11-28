import { createFileRoute } from '@tanstack/react-router';
import { PlannedPage } from '../../../../features/console/later-page';
import { plannedPages } from '../../../../features/console/messages';

export const Route = createFileRoute('/u/$slot/_console/security')({ component: Security });

function Security() {
  const { workspace } = Route.useRouteContext();
  const { slot } = Route.useParams();
  return <PlannedPage slot={slot} id="secOverview" title={plannedPages.security.title} body={plannedPages.security.body(workspace.name)} planned={plannedPages.security.planned} />;
}
