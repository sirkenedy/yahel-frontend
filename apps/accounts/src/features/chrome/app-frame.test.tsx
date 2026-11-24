import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { LinkRouter } from '@yahel/ui';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flowMessages } from '../../flow/messages';
import { dismissToast, say } from '../../flow/toasts';
import { AppFrame } from './app-frame';
import { chromeMessages as m } from './messages';

const links = { home: '/signin', signUp: 'https://yahel.example/create', help: 'https://yahel.example/help', privacy: 'https://yahel.example/privacy', terms: null };

afterEach(() => {
  delete document.documentElement.dataset.theme;
  act(() => dismissToast());
  vi.restoreAllMocks();
});

describe('AppFrame', () => {
  it('shows the brand, the question, the data-location promise and only the links it was given', () => {
    render(<AppFrame links={links}>the question</AppFrame>);

    expect(screen.getByRole('link', { name: m.brandHome })).toHaveAttribute('href', '/signin');
    expect(screen.getByRole('main')).toHaveTextContent('the question');
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(m.dataLocation);
    expect(within(footer).getByRole('link', { name: m.help })).toHaveAttribute('href', links.help);
    expect(within(footer).getByRole('link', { name: m.privacy })).toHaveAttribute('href', links.privacy);
    expect(within(footer).queryByRole('link', { name: m.terms })).not.toBeInTheDocument();
  });

  it('sends the brand link through the router, so the flow is not wiped by a page load', async () => {
    const navigate = vi.fn();
    render(
      <LinkRouter navigate={navigate}>
        <AppFrame links={links}>q</AppFrame>
      </LinkRouter>,
    );

    await userEvent.click(screen.getByRole('link', { name: m.brandHome }));

    expect(navigate).toHaveBeenCalledWith('/signin', undefined);
  });

  it('keeps the browser chrome the colour of the page when the theme is switched', async () => {
    document.documentElement.style.setProperty('--ws-color-daylight-canvas', '#0B0D1F');
    render(<AppFrame links={links}>q</AppFrame>);

    await userEvent.click(screen.getByRole('button', { name: m.switchToDark }));

    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#0B0D1F');
    document.documentElement.style.removeProperty('--ws-color-daylight-canvas');
  });

  it('offers account creation only when there is somewhere to send people', () => {
    const { rerender } = render(<AppFrame links={links}>q</AppFrame>);
    expect(screen.getByRole('link', { name: m.createAccount })).toHaveAttribute('href', links.signUp);

    rerender(<AppFrame links={{ ...links, signUp: null }}>q</AppFrame>);
    expect(screen.queryByRole('link', { name: m.createAccount })).not.toBeInTheDocument();
    expect(screen.queryByText(m.newHere)).not.toBeInTheDocument();
  });

  it('offers sign-in to someone who is creating an account', () => {
    render(<AppFrame links={{ ...links, home: '/personal', homeLabel: m.brandSignUp, signUp: null, signIn: '/signin' }}>q</AppFrame>);

    expect(screen.getByRole('link', { name: m.brandSignUp })).toHaveAttribute('href', '/personal');
    expect(screen.getByText(m.haveAccount)).toBeInTheDocument();
    expect(within(screen.getByRole('banner')).getByRole('link', { name: m.signIn })).toHaveAttribute('href', '/signin');
  });

  it('offers to hide personal details only on screens that ask for them, and says which way the control will go', async () => {
    const onToggle = vi.fn();
    const { container, rerender } = render(
      <AppFrame links={links} privacy={{ isOn: false, onToggle }}>
        q
      </AppFrame>,
    );
    const hide = screen.getByRole('button', { name: m.hideDetails });
    expect(hide).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelector('[data-private]')).toBeNull();

    await userEvent.click(hide);
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(
      <AppFrame links={links} privacy={{ isOn: true, onToggle }}>
        q
      </AppFrame>,
    );
    expect(screen.getByRole('button', { name: m.showDetails })).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('[data-private]')).not.toBeNull();

    rerender(<AppFrame links={links}>q</AppFrame>);
    expect(screen.queryByRole('button', { name: m.showDetails })).not.toBeInTheDocument();
  });

  it('shows the account menu for whoever is signed in, and nothing when nobody is', () => {
    const menu = { current: { name: 'Amara Okafor', email: 'amara.okafor@yahel.example', kind: 'person' as const, badge: m.personalAccount }, others: [], manageHref: null, onSignOut: vi.fn(), onPick: vi.fn(), onSignOutOf: vi.fn(), onAdd: vi.fn(), onSignOutAll: vi.fn() };
    const { rerender } = render(
      <AppFrame links={links} menu={menu}>
        q
      </AppFrame>,
    );
    expect(within(screen.getByRole('banner')).getByRole('button', { name: m.menu.trigger('amara.okafor@yahel.example') })).toHaveTextContent('AO');

    rerender(<AppFrame links={links}>q</AppFrame>);
    expect(screen.queryByRole('button', { name: /^Account:/ })).not.toBeInTheDocument();
  });

  it('switches between light and dark, naming the control for what it will do', async () => {
    render(<AppFrame links={links}>q</AppFrame>);

    await userEvent.click(screen.getByRole('button', { name: m.switchToDark }));
    expect(document.documentElement.dataset.theme).toBe('dark');

    await userEvent.click(screen.getByRole('button', { name: m.switchToLight }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('says across the top when the device is offline, takes it away when the connection is back, and says so', () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    render(<AppFrame links={links}>q</AppFrame>);
    expect(document.body).not.toHaveTextContent(flowMessages.offlineLead);

    onLine.mockReturnValue(false);
    act(() => void window.dispatchEvent(new Event('offline')));
    const bar = screen.getByText(flowMessages.offlineLead).closest('[aria-live="polite"]');
    expect(bar).toHaveTextContent(`${flowMessages.offlineLead} ${flowMessages.offlineBar}`);
    // Above the header, so it pushes the page down instead of covering it.
    expect(bar!.compareDocumentPosition(screen.getByRole('banner')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.body).not.toHaveTextContent(flowMessages.backOnline);

    onLine.mockReturnValue(true);
    act(() => void window.dispatchEvent(new Event('online')));
    expect(document.body).not.toHaveTextContent(flowMessages.offlineLead);
    expect(screen.getByText(flowMessages.backOnline).closest('[aria-live="polite"]')).not.toBeNull();
  });

  it('starts with the bar when the page opens without a connection', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(<AppFrame links={links}>q</AppFrame>);

    expect(screen.getByText(flowMessages.offlineLead)).toBeInTheDocument();
  });

  it('shows a passing confirmation in a region that is already on the page, and puts it away when dismissed', async () => {
    render(<AppFrame links={links}>q</AppFrame>);
    const regions = [...document.querySelectorAll('[aria-live="polite"]')];
    expect(screen.queryByRole('button', { name: flowMessages.dismiss })).not.toBeInTheDocument();

    act(() => say('New code sent. Older codes no longer work.'));
    const toast = screen.getByText('New code sent. Older codes no longer work.');
    expect(regions.some((region) => region.contains(toast))).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: flowMessages.dismiss }));
    expect(screen.queryByText('New code sent. Older codes no longer work.')).not.toBeInTheDocument();
  });

  it('lets a toast leave by itself when its time is up, and shows the next one said', () => {
    const { container } = render(<AppFrame links={links}>q</AppFrame>);

    act(() => say('Copied.'));
    act(() => say('You’re back online.'));
    expect(screen.queryByText('Copied.')).not.toBeInTheDocument();
    expect(screen.getByText('You’re back online.')).toBeInTheDocument();

    // jsdom has no animations, so React listens for the prefixed event there; a browser sends the plain one.
    fireEvent(container.querySelector('.ws-flow-toast__bar')!, new Event('webkitAnimationEnd', { bubbles: true }));
    expect(screen.queryByText('You’re back online.')).not.toBeInTheDocument();
  });
});
