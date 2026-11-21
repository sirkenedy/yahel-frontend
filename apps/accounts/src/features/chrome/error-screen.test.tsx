import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageError, RootErrorBoundary, StepError } from './error-screen';
import { chromeMessages as m } from './messages';

const failure = new Error('Objects are not valid as a React child (found: object with keys {})');
const quietConsole = () => vi.spyOn(console, 'error').mockImplementation(() => undefined);

afterEach(() => vi.restoreAllMocks());

describe('StepError', () => {
  it('apologises in plain words and never shows what the error said', () => {
    quietConsole();
    render(<StepError error={failure} onRetry={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1, name: m.errorTitle })).toBeInTheDocument();
    expect(screen.getByText(m.errorLede)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/Objects are not valid|React/);
    expect(document.title).toBe(m.errorPageTitle);
  });

  it('sends the details to the console for whoever is debugging', () => {
    const logged = quietConsole();
    render(<StepError error={failure} onRetry={vi.fn()} />);

    expect(logged).toHaveBeenCalledWith(failure);
  });

  it('offers a retry and the way back to the start of sign in', async () => {
    quietConsole();
    const onRetry = vi.fn();
    render(<StepError error={failure} onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button', { name: m.tryAgain }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: m.backToSignIn })).toHaveAttribute('href', '/signin');
  });
});

describe('PageError', () => {
  it('puts the message inside the flow frame, with the brand', () => {
    quietConsole();
    render(<PageError error={failure} onRetry={vi.fn()} />);

    expect(screen.getByRole('img', { name: m.brand })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent(m.errorTitle);
  });
});

describe('RootErrorBoundary', () => {
  function Fragile({ broken }: { broken: boolean }) {
    if (broken) throw failure;
    return <p>the app</p>;
  }

  function Harness() {
    const [broken, setBroken] = useState(true);
    const [attempt, setAttempt] = useState(0);
    return (
      <RootErrorBoundary
        key={attempt}
        onRetry={() => {
          setBroken(false);
          setAttempt(attempt + 1);
        }}
      >
        <Fragile broken={broken} />
      </RootErrorBoundary>
    );
  }

  it('shows its children while nothing has failed', () => {
    render(
      <RootErrorBoundary onRetry={vi.fn()}>
        <p>the app</p>
      </RootErrorBoundary>,
    );

    expect(screen.getByText('the app')).toBeInTheDocument();
  });

  it('replaces whatever threw with the styled screen, and recovers on retry', async () => {
    quietConsole();
    render(<Harness />);

    expect(screen.getByRole('heading', { name: m.errorTitle })).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('Objects are not valid');

    await userEvent.click(screen.getByRole('button', { name: m.tryAgain }));

    expect(screen.getByText('the app')).toBeInTheDocument();
  });
});
