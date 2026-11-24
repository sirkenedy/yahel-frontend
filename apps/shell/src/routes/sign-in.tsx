import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card } from '@yahel/ui';
import { authMessages as m } from '../features/auth/messages';
import { SignInForm } from '../features/auth/sign-in-form';

// Open whether or not this tab is signed in: signing in here adds an account to the browser.
export const Route = createFileRoute('/sign-in')({ component: SignInPage });

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
        <SignInForm session={session} onSignedIn={(slot) => void navigate({ to: '/u/$slot', params: { slot: String(slot) } })} />
      </Card>
    </div>
  );
}
