import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetProductSelection } from './features/products/product-selection';
import { createSiteRouter } from './router';

const open = async (path: string) => {
  render(<RouterProvider router={createSiteRouter(createMemoryHistory({ initialEntries: [path] }))} />);
  await screen.findByRole('heading', { level: 1 });
  return userEvent.setup();
};

const mainNav = () => within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' });

describe('the website', () => {
  const scrollIntoView = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
  });
  afterEach(() => act(resetProductSelection));

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
    ['/#products', []],
    ['/#accounts', []],
    ['/about', ['About']],
    ['/careers', ['Careers']],
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

  it('keeps Home, About and Careers reachable from the footer of a page, with the undecided pages as placeholders', async () => {
    await open('/about');
    const footer = within(screen.getByRole('contentinfo')).getByRole('navigation', { name: 'Footer' });

    expect(within(footer).getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Home', '/'],
      ['About', '/about'],
      ['Careers', '/careers'],
      ['Privacy', '#top'],
      ['Terms', '#top'],
    ]);
  });

  it('leads from the home page’s bar to its sections and the other pages, with Products as a menu', async () => {
    await open('/');

    expect(within(mainNav()).getByRole('button', { name: 'Products' })).toHaveAttribute('aria-expanded', 'false');
    expect(
      within(mainNav())
        .getAllByRole('link')
        .filter((link) => link.closest('[inert]') === null)
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      // Where no script runs, this link stands in for the menu button.
      ['Products', '/#products'],
      ['For business', '/#accounts'],
      ['Security', '/#security'],
      ['Plans', '/#plans'],
      ['About', '/about'],
      ['Careers', '/careers'],
    ]);
  });

  it('lists all nine products with their addresses in the Products menu', async () => {
    const user = await open('/');

    await user.click(within(mainNav()).getByRole('button', { name: 'Products' }));
    const menu = document.getElementById(within(mainNav()).getByRole('button', { name: 'Products' }).getAttribute('aria-controls')!)!;

    expect(within(menu).getAllByRole('link').map((link) => [...link.children].map((part) => part.textContent).filter(Boolean))).toEqual([
      ['Mail', 'mail.yahel.com'],
      ['Calendar', 'calendar.yahel.com'],
      ['Drive', 'drive.yahel.com'],
      ['Docs', 'docs.yahel.com'],
      ['Sheets', 'sheets.yahel.com'],
      ['Slides', 'slides.yahel.com'],
      ['Chat', 'chat.yahel.com'],
      ['Meet', 'meet.yahel.com'],
      ['Admin', 'admin.yahel.com'],
    ]);
    expect(within(menu).getAllByRole('link').every((link) => link.getAttribute('href') === '/#products')).toBe(true);
  });

  it('shows the product chosen from the menu, closes the menu, brings the section into view and moves focus to its tab', async () => {
    const user = await open('/');
    const button = within(mainNav()).getByRole('button', { name: 'Products' });
    await user.click(button);

    await user.click(within(mainNav()).getByRole('link', { name: /^Sheets/ }));

    expect(button).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Sheets' })).toHaveFocus());
    expect(screen.getByRole('tab', { name: 'Sheets' })).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(scrollIntoView.mock.contexts.at(-1)).toHaveAttribute('id', 'products'));
  });

  it('shows the product whose icon is pressed in the hero', async () => {
    const user = await open('/');

    await user.click(within(within(screen.getByRole('main')).getByRole('list', { name: 'Products' })).getByRole('link', { name: 'Meet' }));

    await waitFor(() => expect(screen.getByRole('tab', { name: 'Meet' })).toHaveFocus());
    expect(screen.getByRole('tab', { name: 'Meet' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Mail' })).toHaveAttribute('aria-selected', 'false');
  });

  it('brings a section into view again when its link is followed a second time, and leaves a press meant for a new tab alone', async () => {
    const user = await open('/');
    const plans = within(mainNav()).getByRole('link', { name: 'Plans' });

    await user.click(plans);
    await waitFor(() => expect(scrollIntoView.mock.contexts.at(-1)).toHaveAttribute('id', 'plans'));
    const before = scrollIntoView.mock.calls.length;

    await user.click(plans);
    expect(scrollIntoView.mock.calls.length).toBe(before + 1);
    expect(scrollIntoView.mock.contexts.at(-1)).toHaveAttribute('id', 'plans');
    expect(scrollIntoView.mock.lastCall).toEqual([{ behavior: 'smooth' }]);

    await user.keyboard('{Meta>}');
    await user.click(plans);
    await user.keyboard('{/Meta}');
    expect(scrollIntoView.mock.calls.length).toBe(before + 1);
  });

  it('keeps the product chosen with the tabs themselves, without moving focus elsewhere', async () => {
    const user = await open('/');

    await user.click(screen.getByRole('tab', { name: 'Docs' }));

    expect(screen.getByRole('tab', { name: 'Docs' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Docs' })).toHaveFocus();
  });

  it('gives the home page a footer in four columns: every product, the company, and trust', async () => {
    await open('/');
    const footer = within(screen.getByRole('contentinfo')).getByRole('navigation', { name: 'Footer' });

    expect(
      within(footer)
        .getAllByRole('list')
        .map((list) => [document.getElementById(list.getAttribute('aria-labelledby')!)!.textContent, ...within(list).getAllByRole('link').map((link) => `${link.textContent} ${link.getAttribute('href')}`)]),
    ).toEqual([
      ['Products', 'Mail /#products', 'Calendar /#products', 'Drive /#products', 'Docs /#products', 'Sheets /#products'],
      ['More products', 'Slides /#products', 'Chat /#products', 'Meet /#products', 'Admin /#products'],
      ['Company', 'About /about', 'Careers /careers', 'Plans /#plans'],
      ['Trust', 'Security /#security', 'Privacy /#top', 'Terms /#top', 'Help /#top'],
    ]);
    expect(within(screen.getByRole('contentinfo')).getByText('© Yahel')).toBeInTheDocument();
    expect(within(screen.getByRole('contentinfo')).getByText('English')).toBeInTheDocument();
  });

  it('shows the product chosen from the footer', async () => {
    const user = await open('/');
    const footer = within(screen.getByRole('contentinfo')).getByRole('navigation', { name: 'Footer' });

    await user.click(within(footer).getByRole('link', { name: 'Admin' }));

    await waitFor(() => expect(screen.getByRole('tab', { name: 'Admin' })).toHaveFocus());
    expect(screen.getByRole('tab', { name: 'Admin' })).toHaveAttribute('aria-selected', 'true');
  });

  it('offers the home page’s sections, the other pages and Sign in from the menu on a narrow screen', async () => {
    const user = await open('/');

    await user.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Menu' }));
    const dialog = await screen.findByRole('dialog', { name: 'Menu' });

    expect(within(dialog).getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Products', '/#products'],
      ['For business', '/#accounts'],
      ['Security', '/#security'],
      ['Plans', '/#plans'],
      ['About', '/about'],
      ['Careers', '/careers'],
      ['Sign in', 'http://localhost:5173/sign-in'],
    ]);

    await user.click(within(dialog).getByRole('link', { name: 'Plans' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(scrollIntoView.mock.contexts.at(-1)).toHaveAttribute('id', 'plans'));
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

  it('glides to a section, or goes there at once for a reader who asks for reduced motion', () => {
    expect(createSiteRouter(createMemoryHistory()).options.defaultHashScrollIntoView).toEqual({ behavior: 'smooth' });

    vi.stubGlobal('matchMedia', (query: string) => ({ media: query, matches: query === '(prefers-reduced-motion: reduce)' }));
    expect(createSiteRouter(createMemoryHistory()).options.defaultHashScrollIntoView).toBe(true);
    vi.unstubAllGlobals();
  });

  it('opens the open roles from the closing action of About, without leaving the app', async () => {
    const user = await open('/about');

    await user.click(within(screen.getByRole('main')).getByRole('link', { name: 'See open roles' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Build the tools people open every day.' })).toBeInTheDocument();
    expect(within(mainNav()).getByRole('link', { name: 'Careers' })).toHaveAttribute('aria-current', 'page');
    await waitFor(() => expect(document.title).toBe('Careers at Yahel'));
  });

  it.each(['banner', 'contentinfo'] as const)('opens Careers from the %s without leaving the app', async (landmark) => {
    const user = await open('/');

    await user.click(within(screen.getByRole(landmark)).getByRole('link', { name: 'Careers' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Build the tools people open every day.' })).toBeInTheDocument();
  });

  it('says so when nothing lives at an address, and offers the way home', async () => {
    await open('/no-such-page');

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Page not found');
  });
});
