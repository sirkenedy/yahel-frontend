import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MouseEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { HomeHero } from './home-hero';
import { signInUrl, testProducts } from './home-test-data';

const renderHero = ({ onPickProduct = vi.fn(), onFollow = vi.fn() } = {}) =>
  render(
    <HomeHero
      signInUrl={signInUrl}
      products={testProducts}
      onPickProduct={onPickProduct}
      productsLink={{ href: '/#products', onClick: (event: MouseEvent) => (event.preventDefault(), onFollow()) }}
      accountsLink={{ href: '/#accounts' }}
    />,
  );

const position = (element: HTMLElement) => element.closest<HTMLElement>('[data-reveal]')!.style.getPropertyValue('--reveal-index');
const dock = () => screen.getByRole('list', { name: 'Products' });

describe('HomeHero', () => {
  it('says what Yahel is in one heading and one paragraph', () => {
    renderHero();

    expect(screen.getByText('Yahel Workspace')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Everything your work needs. One account.' })).toBeInTheDocument();
    expect(screen.getByText('Mail, calendar, files, documents and meetings that work together. Free for you, and built to run a whole organisation.')).toBeInTheDocument();
  });

  it('offers one main action, to sign-in on the app, and a second as a link to the accounts section', () => {
    renderHero();
    const actions = screen.getByRole('link', { name: 'Create an account' }).parentElement!;

    expect(within(actions).getAllByRole('link').map((link) => link.textContent)).toEqual(['Create an account', 'Set up your business']);
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', signInUrl);
    expect(screen.getByRole('link', { name: 'Set up your business' })).toHaveAttribute('href', '/#accounts');
  });

  it('brings its four blocks in one after another, starting with the first', () => {
    renderHero();

    expect([
      position(screen.getByText('Yahel Workspace')),
      position(screen.getByRole('heading', { level: 1 })),
      position(screen.getByText(/^Mail, calendar, files/)),
      position(screen.getByRole('link', { name: 'Create an account' })),
    ]).toEqual(['0', '1', '2', '3']);
  });

  it('names every product as an icon link to the Products section, in order', () => {
    renderHero();

    expect(within(dock()).getAllByRole('link').map((link) => [link.getAttribute('aria-label'), link.getAttribute('href')])).toEqual([
      ['Mail', '/#products'],
      ['Calendar', '/#products'],
      ['Drive', '/#products'],
    ]);
  });

  it('pops the icons in one after another, following the text, each marked to pop', () => {
    renderHero();
    const icons = within(dock()).getAllByRole('link');

    expect(icons.map(position)).toEqual(['4', '5', '6']);
    expect(icons.map((icon) => icon.closest('[data-reveal]')!.getAttribute('data-reveal'))).toEqual(['pop', 'pop', 'pop']);
  });

  it('picks the product whose icon is pressed, and follows the link to the Products section', async () => {
    const onPickProduct = vi.fn();
    const onFollow = vi.fn();
    renderHero({ onPickProduct, onFollow });

    await userEvent.setup().click(within(dock()).getByRole('link', { name: 'Calendar' }));

    expect(onPickProduct).toHaveBeenCalledExactlyOnceWith('calendar');
    expect(onFollow).toHaveBeenCalledOnce();
  });

  it('shows the product as one picture: its sample names and times are not read out as content', () => {
    renderHero();
    const picture = screen.getByRole('img', { name: 'The Yahel home screen, showing today’s events, unread mail and recent files.' });

    expect(within(picture).getByText('Good morning, Amara')).toBeInTheDocument();
    expect(['Today', 'Unread mail', 'Recent files'].map((title) => within(picture).getByText(title).textContent)).toEqual(['Today', 'Unread mail', 'Recent files']);
    expect(position(picture)).toBe('4');
  });
});
