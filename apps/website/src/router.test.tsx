import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSiteRouter } from './router';

const open = async (path: string) => {
  render(<RouterProvider router={createSiteRouter(createMemoryHistory({ initialEntries: [path] }))} />);
  await screen.findByRole('heading', { level: 1 });
  return userEvent.setup();
};

const mainNav = () => within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' });

describe('the website', () => {
  beforeEach(() => vi.stubGlobal('scrollTo', vi.fn()));

  it('wraps every page in the bar, one main region and the footer', async () => {
    await open('/about');

    const banner = screen.getByRole('banner');
    expect(within(banner).getByRole('link', { name: 'Yahel home' })).toHaveAttribute('href', '/');
    expect(within(mainNav()).getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Products', '/#products'],
      ['About', '/about'],
      ['Careers', '/careers'],
    ]);
    expect(within(screen.getByRole('main')).getByRole('heading', { level: 1, name: 'Work tools that stay out of the way.' })).toBeInTheDocument();
    expect(within(screen.getByRole('contentinfo')).getByText('© Yahel')).toBeInTheDocument();
  });

  it('marks the page being read in the navigation', async () => {
    await open('/about');

    expect(within(mainNav()).getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
    expect(within(mainNav()).getByRole('link', { name: 'Products' })).not.toHaveAttribute('aria-current');
    expect(within(mainNav()).getByRole('link', { name: 'Careers' })).not.toHaveAttribute('aria-current');
  });

  it.each([
    ['/', []],
    ['/#products', ['Products']],
    ['/about', ['About']],
  ])('marks at most one link in the bar as the current page at %s', async (path, current) => {
    await open(path);

    expect(
      within(screen.getByRole('banner'))
        .queryAllByRole('link', { current: 'page' })
        .map((link) => link.textContent),
    ).toEqual(current);
  });

  it('has one filled account action, pointing at sign-in on the app', async () => {
    await open('/about');
    const banner = screen.getByRole('banner');

    expect(within(banner).getByRole('link', { name: 'Create account' })).toHaveAttribute('href', 'http://localhost:5173/sign-in');
    expect(within(banner).queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('adds a quiet Sign in to the bar on the home page', async () => {
    await open('/');
    const banner = screen.getByRole('banner');

    expect(within(banner).getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', 'http://localhost:5173/sign-in');
    expect(within(banner).getByRole('link', { name: 'Create account' })).toHaveAttribute('href', 'http://localhost:5173/sign-in');
    expect(within(mainNav()).queryByRole('link', { current: 'page' })).not.toBeInTheDocument();
    expect(document.title).toBe('Yahel');
  });

  it('keeps Home, About and Careers reachable from the footer, with the undecided pages as placeholders', async () => {
    await open('/');
    const footer = within(screen.getByRole('contentinfo')).getByRole('navigation', { name: 'Footer' });

    expect(within(footer).getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Home', '/'],
      ['About', '/about'],
      ['Careers', '/careers'],
      ['Privacy', '#top'],
      ['Terms', '#top'],
    ]);
  });

  it('moves between pages without leaving the app, and renames the document', async () => {
    const user = await open('/');

    await user.click(within(mainNav()).getByRole('link', { name: 'About' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Work tools that stay out of the way.' })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('About Yahel'));
  });

  it('offers the same links, and Sign in, from the menu on a narrow screen', async () => {
    const user = await open('/about');

    await user.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Menu' }));
    const dialog = await screen.findByRole('dialog', { name: 'Menu' });

    expect(within(dialog).getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Products', '/#products'],
      ['About', '/about'],
      ['Careers', '/careers'],
      ['Sign in', 'http://localhost:5173/sign-in'],
    ]);
    expect(within(dialog).getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
  });

  it('closes the menu when a page is chosen from it', async () => {
    const user = await open('/about');
    await user.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Menu' }));
    const dialog = await screen.findByRole('dialog', { name: 'Menu' });

    await user.click(within(dialog).getByRole('link', { name: 'Products' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByRole('heading', { level: 1, name: 'Everything your work needs. One account.' })).toBeInTheDocument();
  });

  it('says so when nothing lives at an address, and offers the way home', async () => {
    await open('/careers');

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Page not found');
  });
});
