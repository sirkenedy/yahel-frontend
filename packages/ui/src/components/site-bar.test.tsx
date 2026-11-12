import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LinkButton, SiteBar, SiteMenu } from '../index';

const scrollTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  act(() => void window.dispatchEvent(new Event('scroll')));
};

const renderBar = () =>
  render(
    <SiteBar
      brand={<a href="/">Yahel</a>}
      navLabel="Main"
      nav={
        <>
          <a href="/">Products</a>
          <a href="/about" aria-current="page">
            About
          </a>
        </>
      }
      wideAction={<a href="/sign-in">Sign in</a>}
      action={<LinkButton href="/sign-in">Create account</LinkButton>}
      menu={
        <SiteMenu label="Menu" closeLabel="Close">
          {(close) => (
            <a href="#top" onClick={close}>
              Careers
            </a>
          )}
        </SiteMenu>
      }
    />,
  );

describe('SiteBar', () => {
  afterEach(() => scrollTo(0));

  it('is the page banner, with the brand, a named navigation and the actions in that order', () => {
    renderBar();
    const banner = screen.getByRole('banner');
    const nav = within(banner).getByRole('navigation', { name: 'Main' });

    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual(['Products', 'About']);
    expect(within(nav).getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
    expect(
      within(banner)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Yahel', 'Products', 'About', 'Sign in', 'Create account']);
    expect(within(banner).getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });

  it('is marked as scrolled only once the page has moved past 8', () => {
    renderBar();
    const banner = screen.getByRole('banner');
    expect(banner).not.toHaveAttribute('data-scrolled');

    scrollTo(8);
    expect(banner).not.toHaveAttribute('data-scrolled');

    scrollTo(9);
    expect(banner).toHaveAttribute('data-scrolled');

    scrollTo(0);
    expect(banner).not.toHaveAttribute('data-scrolled');
  });

  it('starts scrolled when the page loads part-way down', () => {
    scrollTo(400);
    renderBar();

    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled');
  });

  it('stops listening when it is removed', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderBar();

    unmount();

    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    remove.mockRestore();
  });
});

describe('SiteMenu', () => {
  const open = async () => {
    const user = userEvent.setup();
    renderBar();
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    return { user, dialog: await screen.findByRole('dialog', { name: 'Menu' }) };
  };

  it('opens a modal dialog named for the button, hides the page behind it, and moves focus into it', async () => {
    const { dialog } = await open();

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(within(dialog).getByRole('link', { name: 'Careers' })).toBeInTheDocument();
  });

  it('keeps focus inside while it is open', async () => {
    const { user, dialog } = await open();

    for (let presses = 0; presses < 4; presses += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('closes on Escape and returns focus to the button', async () => {
    const { user } = await open();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus());
  });

  it('closes from its Close button and returns focus to the button', async () => {
    const { user, dialog } = await open();

    await user.click(within(dialog).getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus());
  });

  it('closes when the scrim behind it is pressed, and not when the sheet itself is', async () => {
    const { user, dialog } = await open();

    await user.click(within(dialog).getByRole('heading', { name: 'Menu' }));
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();

    // The scrim has no role of its own: it is the layer that holds the sheet.
    await user.click(dialog.parentElement!.parentElement!);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('has one control that closes it', async () => {
    const { dialog } = await open();

    expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['Close']);
  });

  it('closes when a link is chosen', async () => {
    const { user, dialog } = await open();

    await user.click(within(dialog).getByRole('link', { name: 'Careers' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
