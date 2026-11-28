import { createFileRoute } from '@tanstack/react-router';
import { consoleMessages } from '../../../../features/console/messages';
import { crumbsOf } from '../../../../features/console/nav-tree';
import { FieldsPage } from '../../../../features/users/fields-page';

export const Route = createFileRoute('/u/$slot/_console/users/fields')({ component: Fields });

function Fields() {
  const { slot } = Route.useParams();
  return <FieldsPage crumbs={crumbsOf(slot, 'users')} crumbsLabel={consoleMessages.crumbs} />;
}
