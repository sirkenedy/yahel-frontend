import { createFileRoute } from '@tanstack/react-router';
import { PlannedPage } from '../../../../features/console/later-page';
import { plannedPages } from '../../../../features/console/messages';

export const Route = createFileRoute('/u/$slot/_console/billing')({ component: Billing });

function Billing() {
  const { slot } = Route.useParams();
  return <PlannedPage slot={slot} id="subs" title={plannedPages.billing.title} body={plannedPages.billing.body} planned={plannedPages.billing.planned} />;
}
