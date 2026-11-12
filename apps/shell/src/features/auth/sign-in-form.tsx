import { isApiError } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { Banner, Button, TextField } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { authMessages as m } from './messages';

export interface SignInFormProps {
  session: Pick<Session, 'signIn'>;
  onSignedIn: () => void;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

const validate = (email: string, password: string): FieldErrors => ({
  ...(email.trim() === '' ? { email: m.emailRequired } : /^\S+@\S+\.\S+$/.test(email.trim()) ? {} : { email: m.emailInvalid }),
  ...(password === '' ? { password: m.passwordRequired } : {}),
});

const describeFailure = (error: unknown) => {
  if (!isApiError(error)) return m.unexpected;
  if (error.isNetwork) return m.network;
  if (error.status === 429) return m.tooManyAttempts;
  if (error.status === 400 || error.status === 401 || error.status === 404) return m.wrongCredentials;
  return m.unexpected;
};

export function SignInForm({ session, onSignedIn }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const errors = validate(email, password);
    setFieldErrors(errors);
    setFailure(null);
    if (errors.email || errors.password) {
      event.currentTarget.querySelector<HTMLInputElement>(`input[name="${errors.email ? 'email' : 'password'}"]`)?.focus();
      return;
    }
    setPending(true);
    try {
      const result = await session.signIn(email.trim(), password);
      if (result.ok) onSignedIn();
      else setFailure(m.mfaNotSupported);
    } catch (error) {
      setFailure(describeFailure(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit} noValidate aria-labelledby="sign-in-title">
      {failure ? <Banner tone="danger">{failure}</Banner> : null}
      <TextField
        label={m.emailLabel}
        name="email"
        type="email"
        autoComplete="username"
        inputMode="email"
        placeholder={m.emailPlaceholder}
        value={email}
        onChange={setEmail}
        error={fieldErrors.email}
        isRequired
        validationBehavior="aria"
      />
      <TextField
        label={m.passwordLabel}
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        error={fieldErrors.password}
        isRequired
        validationBehavior="aria"
      />
      <Button type="submit" variant="primary" isPending={pending} pendingLabel={m.submitting}>
        {m.submit}
      </Button>
    </form>
  );
}
