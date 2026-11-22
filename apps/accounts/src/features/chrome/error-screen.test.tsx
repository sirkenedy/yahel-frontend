import { ApiError } from '@yahel/api-client';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageError, RootErrorBoundary, StepError, errorExitFor } from './error-screen';
import { flowMessages as m } from '../../flow/messages';
import { chromeMessages } from './messages';

const failure = new Error('Objects are not valid as a React child (found: object with keys {})');
const exit = errorExitFor('/signin/password');
const quietConsole = () => vi.spyOn(console, 'error').mockImplementation(() => undefined);

afterEach(() => vi.restoreAllMocks());

describe('StepError', () => {
  it('apologises in plain words and never shows what the error said', () => {
    quietConsole();
    render(<StepError error={failure} onRetry={vi.fn()} exit={exit} />);

    expect(screen.getByRole('heading', { level: 1, name: m.errorTitle })).toBeInTheDocument();
    expect(screen.getByText(m.errorLede)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/Objects are not valid|React/);
    expect(document.title).toBe(m.errorPageTitle);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName('Something went wrong on our side.');
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('says when it happened, and gives no reference when the failure has none', () => {
    quietConsole();
    render(<StepError error={failure} onRetry={vi.fn()} exit={exit} />);

    expect(screen.getByText(m.quoteThis)).toBeInTheDocument();
    expect(screen.getAllByRole('term').map((label) => label.textContent)).toEqual([m.timeLabel]);
    expect(screen.getByRole('definition')).toHaveTextContent(/\d{4}/);
    expect(screen.queryByRole('button', { name: m.copy })).not.toBeInTheDocument();
  });

  it('gives the request id to quote, with a way to copy it, and never the server’s words', async () => {
    quietConsole();
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<StepError error={new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'MongoServerError: E11000 at users.repository.ts', requestId: 'Y-7F3K-2Q' })} onRetry={vi.fn()} exit={exit} />);

    expect(screen.getAllByRole('term').map((label) => label.textContent)).toEqual([m.referenceLabel, m.timeLabel]);
    expect(screen.getAllByRole('definition')[0]).toHaveTextContent('Y-7F3K-2Q');
    expect(document.body).not.toHaveTextContent(/Mongo|E11000|repository|INTERNAL_ERROR/);

    await user.click(screen.getByRole('button', { name: m.copy }));
    expect(writeText).toHaveBeenCalledWith('Y-7F3K-2Q');
    expect(await screen.findByRole('button', { name: m.copied })).toBeInTheDocument();
  });

  it.each(['unknown', '<img src=x onerror=alert(1)>', 'two words', 'ab'])('shows no reference for a request id that is not plainly an id: %s', (requestId) => {
    quietConsole();
    render(<StepError error={new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'x', requestId })} onRetry={vi.fn()} exit={exit} />);

    expect(screen.getAllByRole('term').map((label) => label.textContent)).toEqual([m.timeLabel]);
    expect(within(screen.getByRole('region')).queryByText(requestId)).not.toBeInTheDocument();
  });

  it('sends the details to the console for whoever is debugging', () => {
    const logged = quietConsole();
    render(<StepError error={failure} onRetry={vi.fn()} exit={exit} />);

    expect(logged).toHaveBeenCalledWith(failure);
  });

  it('offers a retry and the way back to the start of sign in', async () => {
    quietConsole();
    const onRetry = vi.fn();
    render(<StepError error={failure} onRetry={onRetry} exit={exit} />);

    await userEvent.click(screen.getByRole('button', { name: m.tryAgain }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: m.backToSignIn })).toHaveAttribute('href', '/signin');
  });
});

describe('errorExitFor', () => {
  it('leads back to the start of whichever flow the person was in', () => {
    expect(errorExitFor('/personal/password')).toEqual({ href: '/personal', label: chromeMessages.startAgain });
    expect(errorExitFor('/personal')).toEqual({ href: '/personal', label: chromeMessages.startAgain });
    expect(errorExitFor('/business/checkout')).toEqual({ href: '/business', label: chromeMessages.startAgain });
    expect(errorExitFor('/business')).toEqual({ href: '/business', label: chromeMessages.startAgain });
    expect(errorExitFor('/businesses')).toEqual({ href: '/signin', label: m.backToSignIn });
    expect(errorExitFor('/signin/password')).toEqual({ href: '/signin', label: m.backToSignIn });
    expect(errorExitFor('/personally')).toEqual({ href: '/signin', label: m.backToSignIn });
    expect(errorExitFor('/')).toEqual({ href: '/signin', label: m.backToSignIn });
  });

  it('is what the failed screen offers', () => {
    quietConsole();
    render(<StepError error={failure} onRetry={vi.fn()} exit={errorExitFor('/personal/birth')} />);

    expect(screen.getByRole('link', { name: chromeMessages.startAgain })).toHaveAttribute('href', '/personal');
    expect(screen.queryByRole('link', { name: m.backToSignIn })).not.toBeInTheDocument();
  });
});

describe('PageError', () => {
  it('puts the message inside the flow frame, with the brand', () => {
    quietConsole();
    render(<PageError error={failure} onRetry={vi.fn()} exit={exit} />);

    expect(screen.getByRole('img', { name: chromeMessages.brand })).toBeInTheDocument();
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
        exit={exit}
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
      <RootErrorBoundary onRetry={vi.fn()} exit={exit}>
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
