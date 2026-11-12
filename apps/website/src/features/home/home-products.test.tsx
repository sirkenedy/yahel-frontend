import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AppIconName } from '@yahel/ui';
import { HomeProducts } from './home-products';
import { reachable, testProducts } from './home-test-data';

const section = ({ selectedId = 'mail' as AppIconName, picks = 0, onSelect = vi.fn() } = {}) => (
  <HomeProducts products={testProducts} selectedId={selectedId} picks={picks} onSelect={onSelect} productsLink={{ href: '/#products' }} />
);

const tab = (name: string) => screen.getByRole('tab', { name });
const shownPanel = () => {
  const panels = reachable(screen.getAllByRole('tabpanel', { hidden: true }));
  expect(panels).toHaveLength(1);
  return within(panels[0]!);
};

describe('HomeProducts', () => {
  it('introduces the products and is the target of links to #products', () => {
    const { container } = render(section());

    expect(screen.getByRole('heading', { level: 2, name: 'Nine apps. One way of working.' })).toBeInTheDocument();
    expect(screen.getByText('Each app has its own address and opens with the same account. Sign in once and move between them.')).toBeInTheDocument();
    expect(container.querySelector('#products')).toContainElement(screen.getByRole('tablist', { name: 'Products' }));
  });

  it('has one tab for each product, in order, with the given product selected', () => {
    render(section());

    expect(screen.getAllByRole('tab').map((element) => [element.textContent, element.getAttribute('aria-selected')])).toEqual([
      ['Mail', 'true'],
      ['Calendar', 'false'],
      ['Drive', 'false'],
    ]);
  });

  it('shows the selected product’s name, what it is for, and a link named for its address, and keeps the others out of reach', () => {
    render(section({ selectedId: 'drive' }));
    const panel = shownPanel();

    expect(panel.getByRole('heading', { level: 3, name: 'Drive' })).toBeInTheDocument();
    expect(panel.getByText('Keep your files in one place, find them from anywhere and share them safely.')).toBeInTheDocument();
    expect(panel.getByRole('link', { name: 'Open drive.yahel.com' })).toHaveAttribute('href', '/#products');
    expect(reachable(screen.getAllByRole('heading', { level: 3 })).map((heading) => heading.textContent)).toEqual(['Drive']);
  });

  it('reports the tab that is pressed', async () => {
    const onSelect = vi.fn();
    render(section({ onSelect }));

    await userEvent.setup().click(tab('Calendar'));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('calendar');
  });

  it('moves focus to the selected tab when a product is picked from elsewhere, and only then', async () => {
    const { rerender } = render(section());
    const settle = () => new Promise((resolve) => requestAnimationFrame(resolve));
    await settle();
    expect(document.body).toHaveFocus();

    rerender(section({ selectedId: 'calendar' }));
    await settle();
    expect(document.body).toHaveFocus();

    rerender(section({ selectedId: 'drive', picks: 1 }));
    await waitFor(() => expect(tab('Drive')).toHaveFocus());

    act(() => tab('Drive').blur());
    rerender(section({ selectedId: 'drive', picks: 2 }));
    await waitFor(() => expect(tab('Drive')).toHaveFocus());
  });

  it('does not take focus when the page opens with a product picked on an earlier visit', async () => {
    render(section({ selectedId: 'calendar', picks: 3 }));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(document.body).toHaveFocus();
  });
});
