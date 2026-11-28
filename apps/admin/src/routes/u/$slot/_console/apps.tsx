import { createFileRoute } from '@tanstack/react-router';
import { PlannedPage } from '../../../../features/console/later-page';
import { plannedPages } from '../../../../features/console/messages';

export const Route = createFileRoute('/u/$slot/_console/apps')({ component: Apps });

function Apps() {
  const { slot } = Route.useParams();
  return <PlannedPage slot={slot} id="appsOverview" title={plannedPages.apps.title} body={plannedPages.apps.body} planned={plannedPages.apps.planned} />;
}
