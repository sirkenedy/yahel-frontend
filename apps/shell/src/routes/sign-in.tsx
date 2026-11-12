import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Card } from '@yahel/ui';
import { authMessages as m } from '../features/auth/messages';
import { SignInForm } from '../features/auth/sign-in-form';

export const Route = createFileRoute('/sign-in')({
  beforeLoad: ({ context }) => {
    if (context.session.store.getState().status === 'signed-in') throw redirect({ to: '/' });
  },
  component: SignInPage,
});

function SignInPage() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  return (
    <div className="page page--narrow">
      <Card className="stack">
        <div>
          <h1 id="sign-in-title" className="ws-title-1">
            {m.title}
          </h1>
          <p className="ws-subhead ws-secondary">{m.subtitle}</p>
        </div>
        <SignInForm session={session} onSignedIn={() => void navigate({ to: '/' })} />
      </Card>
    </div>
  );
}
