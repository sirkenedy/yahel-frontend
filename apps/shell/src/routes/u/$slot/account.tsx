import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Banner } from '@yahel/ui';
import { useStore } from 'zustand';
import { ProfileDetails, accountMessages as m } from '../../../features/account/account';

export const Route = createFileRoute('/u/$slot/account')({ component: AccountPage });

function AccountPage() {
  const { session } = Route.useRouteContext();
  const { slot } = Route.useParams();
  const handle = useStore(session.store, (state) => state.handle);
  const initial = session.store.getState().profile ?? undefined;
  // Keyed by the account's handle, so one account's details are never shown as another's.
  const profile = useQuery({ queryKey: ['account', handle, 'me'], queryFn: ({ signal }) => session.api.me.get(signal), initialData: initial });

  return (
    <div className="page">
      <Link to="/u/$slot" params={{ slot }} className="link">
        {m.back}
      </Link>
      <h1 className="ws-large-title">{m.accountTitle}</h1>
      {profile.isError ? <Banner tone="danger">{m.loadFailed}</Banner> : null}
      {profile.data ? <ProfileDetails profile={profile.data} /> : <div className="ws-skeleton" style={{ height: 160 }} role="status" aria-label={m.loading} />}
    </div>
  );
}
