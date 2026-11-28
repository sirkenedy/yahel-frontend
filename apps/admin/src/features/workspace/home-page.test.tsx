import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import type { WorkspaceDomain, WorkspaceMember } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { describe, expect, it, vi } from 'vitest';
import { createStore } from 'zustand';
import { HomePage } from './home-page';
import { homeMessages as m } from './messages';

const domain = (status: WorkspaceDomain['status']): WorkspaceDomain => ({ _id: 'd-1', domain: 'northwind.example', method: 'TXT', status, isPrimary: true, mxConfigured: false });
const person = (status: WorkspaceMember['status']): WorkspaceMember => ({ _id: `m-${status}`, globalIdentityId: 'g', tenantId: 't-1', role: 'MEMBER', type: 'internal', status });

const setup = (domains: WorkspaceDomain[]) => {
  const api = {
    tenants: {
      get: vi.fn(async () => ({ _id: 't-1', slug: 'northwind', displayName: 'Northwind Studio', status: 'pending_setup', primaryDomainId: null })),
      domains: { list: vi.fn(async () => domains) },
      members: { list: vi.fn(async () => [person('active'), person('invited'), person('suspended')]) },
    },
  };
  const store = createStore(() => ({ profile: { firstName: 'Amara' } }));
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <HomePage session={{ api, store } as unknown as Session} tenantId="t-1" name="Northwind" slot="0" />
    </QueryClientProvider>,
  );
};

describe('HomePage', () => {
  it('welcomes the administrator and offers to verify the domain while it is not', async () => {
    setup([domain('pending')]);
    expect(screen.getByRole('heading', { level: 1, name: m.welcome('Amara') })).toBeInTheDocument();
    expect(await screen.findByText(m.verifyTitle('northwind.example'))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.verifyAction })).toHaveAttribute('href', '/u/0/setup');
    const steps = within(screen.getByRole('list', { name: m.checklistLabel }));
    expect(steps.getAllByText(m.stepLater)).toHaveLength(3);
    expect(screen.getByText(m.checklistProgress(1, 5), { exact: false })).toBeInTheDocument();
  });

  it('counts the people, and reports the domain as the API knows it', async () => {
    setup([domain('verified')]);
    expect(await screen.findByText(m.people(3, 1))).toBeInTheDocument();
    const card = screen.getByRole('region', { name: m.domain });
    expect(within(card).getByText(m.verified)).toBeInTheDocument();
    expect(within(card).getByText(m.off)).toBeInTheDocument();
    expect(screen.queryByText(m.verifyTitle('northwind.example'))).not.toBeInTheDocument();
    expect(screen.getByText(m.billingLater)).toBeInTheDocument();
  });

  it('asks for a domain when there is none', async () => {
    setup([]);
    expect(await screen.findByText(m.addDomainTitle)).toBeInTheDocument();
  });
});
