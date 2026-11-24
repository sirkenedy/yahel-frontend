import { Link, createFileRoute } from '@tanstack/react-router';
import { Button, Card } from '@yahel/ui';
import { useState } from 'react';
import { useStore } from 'zustand';
import { ProfileSummary, accountMessages as m } from '../../../features/account/account';

export const Route = createFileRoute('/u/$slot/')({ component: HomePage });

function HomePage() {
  const { session, accountsApp } = Route.useRouteContext();
  const { slot } = Route.useParams();
  const profile = useStore(session.store, (state) => state.profile);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await session.signOut().catch(() => undefined);
    window.location.assign(accountsApp.signIn());
  };

  if (!profile) return null;
  return (
    <div className="page">
      <h1 className="ws-large-title">{m.homeTitle}</h1>
      <Card className="stack">
        <ProfileSummary profile={profile} />
        <div className="row">
          <Link to="/u/$slot/account" params={{ slot }} className="link">
            {m.manage}
          </Link>
          <span className="grow" />
          <Button onPress={() => void signOut()} isPending={signingOut} pendingLabel={m.signingOut}>
            {m.signOut}
          </Button>
        </div>
      </Card>
    </div>
  );
}
