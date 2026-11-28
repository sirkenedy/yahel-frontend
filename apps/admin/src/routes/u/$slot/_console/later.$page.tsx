import { createFileRoute } from '@tanstack/react-router';
import { LaterPage } from '../../../../features/console/later-page';

export const Route = createFileRoute('/u/$slot/_console/later/$page')({ component: Later });

function Later() {
  const { slot, page } = Route.useParams();
  return <LaterPage slot={slot} page={page} />;
}
