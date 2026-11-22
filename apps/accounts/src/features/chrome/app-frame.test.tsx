import { render, screen, within } from '@testing-library/react';
import { LinkRouter } from '@yahel/ui';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppFrame } from './app-frame';
import { chromeMessages as m } from './messages';

const links = { home: '/signin', signUp: 'https://yahel.example/create', help: 'https://yahel.example/help', privacy: 'https://yahel.example/privacy', terms: null };

afterEach(() => delete document.documentElement.dataset.theme);

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

  it('shows whose account is signed in, and nothing when nobody is', () => {
    const { rerender } = render(
      <AppFrame links={links} account={{ name: 'Amara Okafor', email: 'amara.okafor@yahel.example' }}>
        q
      </AppFrame>,
    );
    expect(within(screen.getByRole('banner')).getByText(m.signedInAs('amara.okafor@yahel.example'))).toBeInTheDocument();
    expect(within(screen.getByRole('banner')).getByText('AO')).toBeInTheDocument();

    rerender(<AppFrame links={links}>q</AppFrame>);
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
  });

  it('switches between light and dark, naming the control for what it will do', async () => {
    render(<AppFrame links={links}>q</AppFrame>);

    await userEvent.click(screen.getByRole('button', { name: m.switchToDark }));
    expect(document.documentElement.dataset.theme).toBe('dark');

    await userEvent.click(screen.getByRole('button', { name: m.switchToLight }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
