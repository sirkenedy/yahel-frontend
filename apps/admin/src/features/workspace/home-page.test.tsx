import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import type { WorkspaceDomain } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './home-page';
import { homeMessages as m } from './messages';

const domain = (status: WorkspaceDomain['status']): WorkspaceDomain => ({ _id: 'd-1', domain: 'northwind.example', method: 'TXT', status, isPrimary: status === 'verified' });

const setup = (domains: WorkspaceDomain[]) => {
  const session = { api: { tenants: { get: vi.fn(async () => ({ _id: 't-1', slug: 'northwind', displayName: 'Northwind Studio', status: 'pending_setup', primaryDomainId: null })), domains: { list: vi.fn(async () => domains) } } } } as unknown as Session;
  const root = createRootRoute();
  const home = createRoute({ getParentRoute: () => root, path: '/u/$slot', component: () => <HomePage session={session} tenantId="t-1" name="Northwind" slot="0" /> });
  const pages = createRoute({ getParentRoute: () => root, path: '/u/$slot/domains' });
  const router = createRouter({ routeTree: root.addChildren([home, pages]), history: createMemoryHistory({ initialEntries: ['/u/0'] }) });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
};

describe('HomePage', () => {
  it('names the workspace and asks for a domain to be verified while one is not', async () => {
    setup([domain('pending')]);

    expect(await screen.findByRole('heading', { level: 1, name: 'Northwind Studio' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: m.verify('northwind.example') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.toDomains })).toHaveAttribute('href', '/u/0/domains');
  });

  it('says the domains are verified once they are', async () => {
    setup([domain('verified')]);

    expect(await screen.findByRole('heading', { name: m.readyTitle })).toBeInTheDocument();
  });
});
