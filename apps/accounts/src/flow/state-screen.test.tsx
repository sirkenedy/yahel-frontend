import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ServiceStatus } from '@yahel/api-client';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ScreenKind } from './feedback';
import { flowMessages as m } from './messages';
import { StateScreen } from './state-screen';
import type { StateScreenProps } from './state-screen';

const EMAIL = 'amara.okafor@yahel.example';
const exits = { signIn: '/signin/email', signUp: '/personal', resetPassword: '/signin/recover', support: 'https://yahel.example/help' };

const show = (kind: ScreenKind, props: Partial<StateScreenProps> = {}) => {
  const onRetry = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <StateScreen kind={kind} exits={exits} onRetry={onRetry} {...props} />
    </QueryClientProvider>,
  );
  return { onRetry };
};

const link = (name: string) => screen.getByRole('link', { name });
const actions = () => [...screen.getAllByRole('link'), ...screen.queryAllByRole('button')].map((action) => action.textContent);
const isPrimary = (action: HTMLElement) => action.className.includes('--primary');

describe('StateScreen', () => {
  it.each<[ScreenKind, string]>([
    ['locked', m.lockedTitle],
    ['suspended', m.suspendedTitle],
    ['org-paused', m.pausedTitle],
    ['link-expired', m.linkExpiredTitle],
    ['link-used', m.linkUsedTitle],
    ['session-ended', m.sessionEndedTitle],
    ['signed-out-everywhere', m.signedOutTitle],
    ['maintenance', m.maintenanceTitle],
  ])('%s: names the page by its heading, moves focus to it and titles the tab', (kind, title) => {
    show(kind);

    const heading = screen.getByRole('heading', { level: 1, name: title });
    expect(heading).toHaveFocus();
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(document.title).toBe(m.pageTitle(title));
    expect(document.title).toMatch(/ · Yahel$/);
  });

  it('locked: names nobody (the pause is not one account’s), says when to try again, and offers a reset before the way back', () => {
    const retryAt = Date.now() + 15 * 60_000;
    show('locked', { account: EMAIL, retryAt });

    expect(screen.getByText(m.lockedLede)).not.toHaveTextContent(EMAIL);
    expect(screen.getByRole('status')).toHaveTextContent(m.lockedUntil(m.timeOf(retryAt)!));
    expect(document.body).not.toHaveTextContent(/right away/);
    expect(link(m.resetPassword)).toHaveAttribute('href', '/signin/recover');
    expect(isPrimary(link(m.resetPassword))).toBe(true);
    expect(link(m.backToSignIn)).toHaveAttribute('href', '/signin/email');
    expect(isPrimary(link(m.backToSignIn))).toBe(false);
    expect(actions()).toEqual([m.resetPassword, m.backToSignIn]);
  });

  it('locked: gives no time when it knows none, and promises nothing about a reset', () => {
    show('locked');

    expect(screen.getByText(m.lockedLede)).not.toHaveTextContent('@');
    expect(screen.getByRole('status')).toHaveTextContent(m.lockedNote);
    expect(screen.getByRole('status')).not.toHaveTextContent(/reset/i);
    expect(screen.getByRole('status')).not.toHaveTextContent(/try again at/);
  });

  it('locked: without a way to reset, the way back is the one action', () => {
    show('locked', { exits: { signIn: '/signin/email' } });

    expect(actions()).toEqual([m.backToSignIn]);
    expect(isPrimary(link(m.backToSignIn))).toBe(true);
  });

  it('suspended: says the account cannot sign in and that its mail and files are safe, with support first', () => {
    show('suspended', { account: EMAIL });

    expect(screen.getByText(m.suspendedLede(EMAIL))).toHaveTextContent(EMAIL);
    expect(screen.getByRole('status')).toHaveTextContent(m.suspendedNote);
    expect(link(m.contactSupport)).toHaveAttribute('href', exits.support);
    expect(isPrimary(link(m.contactSupport))).toBe(true);
    expect(link(m.useAnotherAccount)).toHaveAttribute('href', '/signin/email');
    expect(isPrimary(link(m.useAnotherAccount))).toBe(false);
  });

  it('suspended: without a support address, another account is the one action; without an address, it says "This account"', () => {
    show('suspended', { exits: { signIn: '/signin/email', support: null } });

    expect(screen.getByText(m.suspendedLede(null))).toHaveTextContent(/^This account can’t sign in/);
    expect(actions()).toEqual([m.useAnotherAccount]);
    expect(isPrimary(link(m.useAnotherAccount))).toBe(true);
  });

  it('organisation paused: says nothing was deleted, who to ask, and offers another account', () => {
    show('org-paused', { account: EMAIL });

    expect(screen.getByText(m.pausedLede(EMAIL))).toHaveTextContent('Nothing has been deleted.');
    expect(screen.getByRole('status')).toHaveTextContent(m.pausedNote);
    expect(actions()).toEqual([m.useAnotherAccount]);
    expect(link(m.useAnotherAccount)).toHaveAttribute('href', '/signin/email');
  });

  it('organisation paused: speaks of "this account" when it does not know whose', () => {
    show('org-paused');

    expect(screen.getByText(m.pausedLede(null))).toHaveTextContent('this account can’t sign in');
  });

  it.each<[ScreenKind, string]>([
    ['link-expired', m.linkExpiredLede],
    ['link-used', m.linkUsedLede],
  ])('%s: explains, and offers to sign in or create an account', (kind, lede) => {
    show(kind);

    expect(screen.getByText(lede)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(link(m.signIn)).toHaveAttribute('href', '/signin/email');
    expect(isPrimary(link(m.signIn))).toBe(true);
    expect(link(m.createAccount)).toHaveAttribute('href', '/personal');
    expect(actions()).toEqual([m.signIn, m.createAccount]);
  });

  it('an expired link offers only sign-in when there is nowhere to create an account', () => {
    show('link-expired', { exits: { signIn: '/signin/email', signUp: null } });

    expect(actions()).toEqual([m.signIn]);
  });

  it('session ended: says why and offers to sign in again', () => {
    show('session-ended');

    expect(screen.getByText(m.sessionEndedLede)).toBeInTheDocument();
    expect(actions()).toEqual([m.signInAgain]);
    expect(link(m.signInAgain)).toHaveAttribute('href', '/signin/email');
  });

  it('signed out everywhere: says what happened and what to do if it was not the person', () => {
    show('signed-out-everywhere');

    expect(screen.getByText(m.signedOutLede)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(m.signedOutNote);
    expect(actions()).toEqual([m.signInAgain]);
  });

  it('maintenance: with nothing to say how long, promises only "soon" and offers another try', async () => {
    const { onRetry } = show('maintenance');

    expect(screen.getByText(m.maintenanceLede(null))).toHaveTextContent('We’ll be back soon.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: m.tryAgain }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('maintenance: gives the time the server said to come back', () => {
    const retryAt = Date.now() + 3_600_000;
    show('maintenance', { retryAt });

    expect(screen.getByText(m.maintenanceLede(m.timeOf(retryAt)!))).toHaveTextContent(`We’ll be back by ${m.timeOf(retryAt)!}.`);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('maintenance: gives the planned window when the service announces one', async () => {
    const window = { from: '2026-11-22T00:00:00.000Z', until: '2026-11-22T02:00:00.000Z' };
    const serviceStatus: ServiceStatus = { window: vi.fn().mockResolvedValue(window) };
    show('maintenance', { serviceStatus, retryAt: Date.now() + 60_000 });

    expect(await screen.findByText(m.maintenanceLede(m.timeOf(window.until)!))).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(m.maintenanceWindow(m.timeOf(window.from)!, m.timeOf(window.until)!));
    expect(serviceStatus.window).toHaveBeenCalledTimes(1);
  });

  it('maintenance: a window whose times are not times is not shown, and nothing is thrown', async () => {
    const serviceStatus: ServiceStatus = { window: vi.fn().mockResolvedValue({ from: 'soon', until: 'later' }) };
    show('maintenance', { serviceStatus });

    await vi.waitFor(() => expect(serviceStatus.window).toHaveBeenCalled());
    expect(await screen.findByText(m.maintenanceLede(null))).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('locked: gives the date as well when the wait ends on another day', () => {
    const retryAt = Date.now() + 26 * 3_600_000;
    show('locked', { retryAt });

    expect(screen.getByRole('status')).toHaveTextContent(m.lockedUntil(m.momentOf(retryAt)));
  });

  it('maintenance: says "soon" when the service announces no window', async () => {
    const serviceStatus: ServiceStatus = { window: vi.fn().mockResolvedValue(null) };
    show('maintenance', { serviceStatus });

    await vi.waitFor(() => expect(serviceStatus.window).toHaveBeenCalled());
    expect(screen.getByText(m.maintenanceLede(null))).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('asks about a window only for maintenance', () => {
    const serviceStatus: ServiceStatus = { window: vi.fn().mockResolvedValue(null) };
    show('locked', { serviceStatus });

    expect(serviceStatus.window).not.toHaveBeenCalled();
  });
});
