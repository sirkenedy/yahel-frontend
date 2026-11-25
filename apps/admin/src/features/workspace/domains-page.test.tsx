import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@yahel/api-client';
import type { WorkspaceDomain } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { describe, expect, it, vi } from 'vitest';
import { DomainsPage } from './domains-page';
import { domainMessages as m, failureMessages as f } from './messages';

const pending: WorkspaceDomain = { _id: 'd-1', domain: 'northwind.example', method: 'CNAME', status: 'pending', isPrimary: false, verifyHost: 'abcdef123456.northwind.example', verifyTarget: 'wv-abc.domainverify.worksync.app.' };
const verified: WorkspaceDomain = { _id: 'd-2', domain: 'studio.example', method: 'TXT', status: 'verified', isPrimary: true };

const setup = (domains: WorkspaceDomain[], verify: () => Promise<unknown> = async () => ({ verified: true })) => {
  let listed = domains;
  const api = {
    tenants: {
      domains: {
        list: vi.fn(async () => listed),
        verify: vi.fn(async () => {
          const answer = await verify();
          listed = listed.map((domain) => (domain._id === 'd-1' ? { ...domain, status: 'verified' as const } : domain));
          return answer;
        }),
        setPrimary: vi.fn(),
        remove: vi.fn(),
        add: vi.fn(async () => ({ domain: { _id: 'd-3', domain: 'new.example', method: 'TXT', status: 'pending', isPrimary: false }, verificationToken: 'tok', instructions: { method: 'TXT', host: '@', value: 'worksync-site-verification=tok', ttlSeconds: 3600 } })),
      },
    },
  };
  const session = { api } as unknown as Session;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <DomainsPage session={session} tenantId="t-1" />
    </QueryClientProvider>,
  );
  return { api, user: userEvent.setup(), add: (domain: WorkspaceDomain) => (listed = [...listed, domain]) };
};

const itemFor = async (domain: string) => (await screen.findByRole('heading', { name: domain })).closest('li')!;

describe('DomainsPage', () => {
  it('shows each domain’s state, and for a pending one the record to add', async () => {
    setup([pending, verified]);

    const item = await itemFor('northwind.example');
    expect(item).toHaveTextContent(m.status.pending);
    const record = within(item).getByRole('region', { name: m.recordTitle });
    expect(record).toHaveTextContent('CNAME');
    expect(record).toHaveTextContent('abcdef123456');
    expect(record).toHaveTextContent('wv-abc.domainverify.worksync.app');
    expect(within(record).getByRole('button', { name: m.copy(m.value) })).toBeInTheDocument();

    const done = await itemFor('studio.example');
    expect(done).toHaveTextContent(m.status.verified);
    expect(done).toHaveTextContent(m.primary);
    expect(within(done).queryByRole('region', { name: m.recordTitle })).not.toBeInTheDocument();
    expect(within(done).queryByRole('button', { name: m.removeLabel('studio.example') })).not.toBeInTheDocument();
  });

  it('verifies a domain and says so', async () => {
    const { api, user } = setup([pending]);

    await user.click(within(await itemFor('northwind.example')).getByRole('button', { name: m.verify }));

    expect(await screen.findByText(m.verified('northwind.example'))).toBeInTheDocument();
    expect(api.tenants.domains.verify).toHaveBeenCalledWith('t-1', 'd-1');
    expect(await screen.findByText(m.status.verified)).toBeInTheDocument();
  });

  it('says the record was not found yet when the check fails, beside the domain', async () => {
    const { user } = setup([pending], async () => Promise.reject(new ApiError({ status: 422, code: 'DOMAIN_NOT_VERIFIED', message: 'No matching TXT verification record' })));

    const item = await itemFor('northwind.example');
    await user.click(within(item).getByRole('button', { name: m.verify }));

    expect(await within(item).findByRole('alert')).toHaveTextContent(f.notFoundYet('northwind.example'));
    expect(item).not.toHaveTextContent('No matching TXT verification record');
  });

  it('shows a pending TXT domain’s record from the list, with copy buttons', async () => {
    setup([{ ...pending, method: 'TXT', verifyHost: null, verifyTarget: null, verificationToken: 'worksync-site-verification=tok' }]);

    const record = within(await itemFor('northwind.example')).getByRole('region', { name: m.recordTitle });
    expect(record).toHaveTextContent('TXT');
    expect(record).toHaveTextContent('worksync-site-verification=tok');
    expect(within(record).getByRole('button', { name: m.copy(m.host) })).toBeInTheDocument();
    expect(within(record).getByRole('button', { name: m.copy(m.value) })).toBeInTheDocument();
  });

  it('asks a domain needing re-verification to keep its record and offers Verify', async () => {
    setup([{ ...pending, method: 'TXT', status: 'reverification_required', verifyHost: null, verifyTarget: null, verificationToken: 'worksync-site-verification=tok' }]);

    const item = await itemFor('northwind.example');
    expect(within(item).getByRole('region', { name: m.recordTitle })).toHaveTextContent(m.recordRecheck('northwind.example'));
    expect(within(item).getByRole('button', { name: m.verify })).toBeInTheDocument();
  });

  it('adds a domain, including one released earlier, and lists its record', async () => {
    const { api, user, add } = setup([verified]);
    await itemFor('studio.example');

    await user.type(screen.getByRole('textbox', { name: m.addLabel }), 'www');
    await user.click(screen.getByRole('button', { name: m.add }));
    expect(screen.getByText(m.invalidDomain)).toBeInTheDocument();
    expect(api.tenants.domains.add).not.toHaveBeenCalled();

    await user.clear(screen.getByRole('textbox', { name: m.addLabel }));
    await user.type(screen.getByRole('textbox', { name: m.addLabel }), ' New.Example ');
    add({ _id: 'd-3', domain: 'new.example', method: 'TXT', status: 'pending', isPrimary: false, verificationToken: 'worksync-site-verification=tok' });
    await user.click(screen.getByRole('button', { name: m.add }));

    expect(api.tenants.domains.add).toHaveBeenCalledWith('t-1', { domain: 'new.example', method: 'TXT', autoProvisionMode: 'off' });
    expect(await within(await itemFor('new.example')).findByText('worksync-site-verification=tok')).toBeInTheDocument();
  });

  it('asks before removing a domain', async () => {
    const { api, user } = setup([pending, verified]);

    await user.click(within(await itemFor('northwind.example')).getByRole('button', { name: m.removeLabel('northwind.example') }));
    expect(screen.getByText(m.confirmRemove('northwind.example'))).toBeInTheDocument();
    expect(api.tenants.domains.remove).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: m.remove }));

    expect(api.tenants.domains.remove).toHaveBeenCalledWith('t-1', 'd-1');
  });
});
