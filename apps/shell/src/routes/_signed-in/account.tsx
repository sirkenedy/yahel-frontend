import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Banner } from '@yahel/ui';
import { ProfileDetails, accountMessages as m } from '../../features/account/account';

export const Route = createFileRoute('/_signed-in/account')({ component: AccountPage });

function AccountPage() {
  const { session } = Route.useRouteContext();
  const initial = session.store.getState().profile ?? undefined;
  const profile = useQuery({ queryKey: ['me'], queryFn: ({ signal }) => session.api.me.get(signal), initialData: initial });

  return (
    <div className="page">
      <Link to="/" className="link">
        {m.back}
      </Link>
      <h1 className="ws-large-title">{m.accountTitle}</h1>
      {profile.isError ? <Banner tone="danger">Unable to load account details. Try again in a moment.</Banner> : null}
      {profile.data ? <ProfileDetails profile={profile.data} /> : <div className="ws-skeleton" style={{ height: 160 }} role="status" aria-label="Loading account" />}
    </div>
  );
}
