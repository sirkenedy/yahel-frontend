import { RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PageError } from './page-error';

const openFailingPage = async () => {
  const rootRoute = createRootRoute();
  const failing = createRoute({
    getParentRoute: () => rootRoute,
    path: '/careers',
    component: () => {
      throw new Error('Failed to fetch dynamically imported module');
    },
  });
  const router = createRouter({ routeTree: rootRoute.addChildren([failing]), history: createMemoryHistory({ initialEntries: ['/careers?team=design'] }), defaultErrorComponent: PageError });
  render(<RouterProvider router={router} />);
  await screen.findByRole('heading', { level: 1 });
};

describe('PageError', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));
  afterEach(() => vi.restoreAllMocks());

  it('says the page did not load and what to do, without the error itself', async () => {
    await openFailingPage();

    expect(screen.getByRole('heading', { level: 1, name: "This page didn't load" })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Check your connection, then try again.');
    expect(screen.queryByText(/dynamically imported/)).not.toBeInTheDocument();
    expect(document.title).toBe("Page didn't load");
  });

  it('offers to try the same address again, as a link that loads it whole', async () => {
    await openFailingPage();

    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute('href', '/careers?team=design');
  });

  it('offers the way home', async () => {
    await openFailingPage();

    expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
  });
});
