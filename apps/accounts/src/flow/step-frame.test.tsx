import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlowStep } from '@yahel/ui';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Feedback } from './feedback';
import { flowMessages as m } from './messages';
import { FlowStepFrame } from './step-frame';
import type { FlowRequest } from './use-flow-request';

const screens = { account: 'amara.okafor@yahel.example', exits: { signIn: '/signin/email', resetPassword: '/signin/recover' } };
const frame = { title: 'What should we call you?', pageTitle: 'What should we call you · Yahel', direction: 'forward', back: null, screens } as const;
const request = (feedback: Feedback | null, more: Partial<FlowRequest> = {}): FlowRequest => ({ isPending: false, feedback, clear: vi.fn(), ...more });
const withQueries = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
const serverError: Feedback = { place: 'banner', tone: 'danger', title: m.serverErrorTitle, text: m.serverErrorText, next: 'retry' };

afterEach(() => vi.useRealTimers());

describe('FlowStepFrame', () => {
  it('shows the question as the heading and names the page after it', () => {
    render(<FlowStepFrame {...frame} lede="This is how you’ll appear." />);

    expect(screen.getByRole('heading', { level: 1, name: frame.title })).toBeInTheDocument();
    expect(screen.getByText('This is how you’ll appear.')).toBeInTheDocument();
    expect(document.title).toBe(frame.pageTitle);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('offers the way back and what leads the step when given', () => {
    render(<FlowStepFrame {...frame} back={{ href: '/personal/name', label: 'Back' }} lead={<p>01 / 06</p>} />);

    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/personal/name');
    expect(screen.getByText('01 / 06')).toBeInTheDocument();
  });

  it('announces a failed request above the step’s content', () => {
    render(
      <FlowStepFrame {...frame} requests={[request({ place: 'banner', tone: 'offline', title: m.offlineTitle, text: m.offlineText })]}>
        <p>fields</p>
      </FlowStepFrame>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(m.offlineTitle);
    expect(alert).toHaveTextContent(m.offlineText);
    expect(alert).toHaveAttribute('data-tone', 'offline');
    expect(alert.compareDocumentPosition(screen.getByText('fields')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('tells good news and plain information politely, and warnings at once', () => {
    const { rerender } = render(<FlowStepFrame {...frame} feedback={{ place: 'banner', tone: 'info', title: 'Confirm your email first', text: 'Look for the message we sent.' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Confirm your email first');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(<FlowStepFrame {...frame} feedback={{ place: 'banner', tone: 'warning', text: 'That took too long.' }} />);
    expect(screen.getByRole('alert')).toHaveAttribute('data-tone', 'warning');
  });

  it('tells the first request that has something to say, before anything carried over from another step', () => {
    const carried: Feedback = { place: 'banner', tone: 'warning', text: 'Your new password is saved.' };
    const { rerender } = render(<FlowStepFrame {...frame} requests={[request(null), request(serverError), request({ place: 'banner', tone: 'danger', text: 'A later failure.' })]} feedback={carried} />);
    expect(screen.getByRole('alert')).toHaveTextContent(m.serverErrorTitle);
    expect(document.body).not.toHaveTextContent('A later failure.');
    expect(document.body).not.toHaveTextContent('Your new password is saved.');

    rerender(<FlowStepFrame {...frame} requests={[request(null)]} feedback={carried} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Your new password is saved.');
  });

  it('leaves a message that belongs beside a field to the field', () => {
    render(<FlowStepFrame {...frame} requests={[request({ place: 'field', field: 'password', text: 'That email and password don’t match.' })]} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('That email and password don’t match.');
  });

  it('adds the reference to quote after what it says', () => {
    render(<FlowStepFrame {...frame} requests={[request({ ...serverError, reference: 'Y-7F3K-2Q' })]} />);

    expect(screen.getByRole('alert')).toHaveTextContent(`${m.serverErrorText} ${m.reference('Y-7F3K-2Q')}`);
  });

  it('counts down a wait the server named, then says it is over', () => {
    vi.useFakeTimers();
    render(<FlowStepFrame {...frame} requests={[request({ place: 'banner', tone: 'warning', title: m.tooManyTitle, text: m.tooManyText, retryAt: Date.now() + 3000 })]} />);
    const banner = screen.getByRole('alert');

    expect(banner).toHaveTextContent(m.tooManyTitle);
    expect(banner).toHaveTextContent(m.tryAgainIn('0:03'));
    expect(banner).not.toHaveTextContent(m.tooManyText);

    act(() => void vi.advanceTimersByTime(2000));
    expect(banner).toHaveTextContent(m.tryAgainIn('0:01'));
    act(() => void vi.advanceTimersByTime(1000));
    expect(banner).toHaveTextContent(m.tryAgainNow);
  });

  it('says to wait a few minutes when the server did not say how long', () => {
    render(<FlowStepFrame {...frame} requests={[request({ place: 'banner', tone: 'warning', title: m.tooManyTitle, text: m.tooManyText })]} />);

    expect(screen.getByRole('alert')).toHaveTextContent(m.tooManyText);
  });

  it('offers what the feedback names as a link or as a button, inside the announcement', async () => {
    const onPress = vi.fn();
    const next = { 'reset-password': { label: 'Reset your password', href: '/signin/recover' }, resend: { label: 'Send a new code', onPress } };
    const { rerender } = render(<FlowStepFrame {...frame} next={next} feedback={{ place: 'banner', tone: 'warning', text: 'Choose a new password first.', next: 'reset-password' }} />);
    expect(within(screen.getByRole('alert')).getByRole('link', { name: 'Reset your password' })).toHaveAttribute('href', '/signin/recover');

    rerender(<FlowStepFrame {...frame} next={next} feedback={{ place: 'banner', tone: 'danger', text: 'This code no longer works.', next: 'resend' }} />);
    await userEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Send a new code' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('offers nothing for an action the step has not given', () => {
    render(<FlowStepFrame {...frame} feedback={{ place: 'banner', tone: 'danger', text: 'This code no longer works.', next: 'resend' }} />);

    expect(within(screen.getByRole('alert')).queryByRole('button')).not.toBeInTheDocument();
    expect(within(screen.getByRole('alert')).queryByRole('link')).not.toBeInTheDocument();
  });

  it('“Try again” makes the request again when it needs nothing typed', async () => {
    const again = vi.fn();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <FlowStepFrame {...frame} requests={[request(serverError, { again })]}>
        <FlowStep.Form onSubmit={onSubmit}>
          <button type="submit">Continue</button>
        </FlowStep.Form>
      </FlowStepFrame>,
    );

    await userEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: m.tryAgain }));
    expect(again).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('“Try again” submits the step’s form when the request needs what was typed', async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <FlowStepFrame {...frame} requests={[request(serverError)]}>
        <FlowStep.Form onSubmit={onSubmit}>
          <button type="submit">Continue</button>
        </FlowStep.Form>
      </FlowStepFrame>,
    );

    await userEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: m.tryAgain }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('lets the step say what “Try again” does', async () => {
    const onPress = vi.fn();
    const again = vi.fn();
    render(<FlowStepFrame {...frame} requests={[request(serverError, { again })]} next={{ retry: { label: 'Start over', onPress } }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Start over' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(again).not.toHaveBeenCalled();
  });

  it('sums up two or more fields to fix in one banner, in place of anything else', () => {
    render(<FlowStepFrame {...frame} toFix={['First name', 'Current email']} requests={[request(serverError)]} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(m.thingsToFix(2));
    expect(alert).toHaveTextContent('First name and Current email.');
    expect(alert).toHaveAttribute('data-tone', 'danger');
    expect(document.body).not.toHaveTextContent(m.serverErrorTitle);
  });

  it('lists three fields with commas and "and"', () => {
    render(<FlowStepFrame {...frame} toFix={['Day', 'Month', 'Year']} />);

    expect(screen.getByRole('alert')).toHaveTextContent('3 things to fix before you continue');
    expect(screen.getByRole('alert')).toHaveTextContent('Day, Month and Year.');
  });

  it('leaves a single field’s problem to the field', () => {
    render(<FlowStepFrame {...frame} toFix={['First name']} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('explains a wait once it has lasted 1.2 seconds, and stops when it ends', () => {
    vi.useFakeTimers();
    const { rerender } = render(<FlowStepFrame {...frame} requests={[request(null), request(null, { isPending: true })]} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(1199));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(1));
    expect(screen.getByRole('status')).toHaveTextContent(m.slow);

    rerender(<FlowStepFrame {...frame} requests={[request(null), request(null)]} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('puts a whole-screen state in the step’s place, with its own page title, and “Try again” shows the step again', () => {
    const clear = vi.fn();
    render(
      <FlowStepFrame {...frame} requests={[request({ place: 'screen', screen: 'maintenance' }, { clear })]}>
        <p>fields</p>
      </FlowStepFrame>,
      { wrapper: withQueries },
    );

    expect(screen.getByRole('heading', { level: 1, name: m.maintenanceTitle })).toHaveFocus();
    expect(screen.queryByRole('heading', { name: frame.title })).not.toBeInTheDocument();
    expect(screen.queryByText('fields')).not.toBeInTheDocument();
    expect(document.title).toBe(m.pageTitle(m.maintenanceTitle));

    fireEvent.click(screen.getByRole('button', { name: m.tryAgain }));
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('“Try again” on a whole-screen state makes the request again when it can', () => {
    const clear = vi.fn();
    const again = vi.fn();
    render(<FlowStepFrame {...frame} requests={[request({ place: 'screen', screen: 'maintenance' }, { clear, again })]} />, { wrapper: withQueries });

    fireEvent.click(screen.getByRole('button', { name: m.tryAgain }));
    expect(again).toHaveBeenCalledTimes(1);
    expect(clear).not.toHaveBeenCalled();
  });

  it('gives a whole-screen state the account, the time and the ways out the flow knows', () => {
    const retryAt = Date.now() + 900_000;
    render(<FlowStepFrame {...frame} requests={[request({ place: 'screen', screen: 'locked', retryAt })]} />, { wrapper: withQueries });

    expect(screen.getByText(m.lockedLede)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(m.lockedUntil(m.timeOf(retryAt)));
    expect(screen.getByRole('link', { name: m.resetPassword })).toHaveAttribute('href', '/signin/recover');
    expect(screen.getByRole('link', { name: m.backToSignIn })).toHaveAttribute('href', '/signin/email');
  });

  it('shows the step and its title again once the state is put away', () => {
    const { rerender } = render(<FlowStepFrame {...frame} requests={[request({ place: 'screen', screen: 'maintenance' })]} />, { wrapper: withQueries });
    expect(document.title).not.toBe(frame.pageTitle);

    rerender(<FlowStepFrame {...frame} requests={[request(null)]} />);
    expect(screen.getByRole('heading', { level: 1, name: frame.title })).toBeInTheDocument();
    expect(document.title).toBe(frame.pageTitle);
  });
});
