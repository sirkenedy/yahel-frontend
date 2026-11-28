import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@yahel/api-client';
import type { WorkspaceDomain } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dismissToast, useToast } from '../../toast';
import { DomainsPage } from './domains-page';
import { domainMessages as m, failureMessages as f } from './messages';

const primary: WorkspaceDomain = { _id: 'd-1', domain: 'northwind.example', method: 'TXT', status: 'pending', isPrimary: true, mxConfigured: false, verificationToken: 'tok' };
const other: WorkspaceDomain = { _id: 'd-2', domain: 'studio.example', method: 'TXT', status: 'verified', isPrimary: false, mxConfigured: true };

function Toast() {
  const toast = useToast();
  return toast ? <p role="status">{toast.text}</p> : null;
}

const setup = (domains: WorkspaceDomain[], remove: () => Promise<unknown> = async () => null) => {
  let listed = domains;
  const api = {
    tenants: {
      domains: {
        list: vi.fn(async () => listed),
        setPrimary: vi.fn(async () => ({})),
        remove: vi.fn(async () => {
          await remove();
          listed = listed.filter((domain) => domain._id !== 'd-2');
          return null;
        }),
        add: vi.fn(async (_: string, body: { domain: string }) => {
          listed = [...listed, { _id: 'd-3', domain: body.domain, method: 'TXT', status: 'pending', isPrimary: false }];
          return { domain: listed.at(-1), verificationToken: 'tok', instructions: { method: 'TXT', host: '@', value: 'tok', ttlSeconds: 3600 } };
        }),
      },
    },
  };
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <DomainsPage session={{ api } as unknown as Session} tenantId="t-1" slot="0" />
      <Toast />
    </QueryClientProvider>,
  );
  return { api, user: userEvent.setup() };
};

const card = async (domain: string) => (await screen.findByRole('region', { name: domain })) as HTMLElement;

describe('DomainsPage', () => {
  beforeEach(dismissToast);

  it('shows the primary domain’s ownership, mail and protection as the API knows them', async () => {
    setup([primary, other]);
    const main = within(await card('northwind.example'));
    expect(main.getByText(m.primary)).toBeInTheDocument();
    expect(main.getByText(m.status.pending)).toBeInTheDocument();
    expect(main.getByText(m.off)).toBeInTheDocument();
    expect(main.getByText(m.notYet)).toBeInTheDocument();
    expect(main.getByRole('link', { name: m.verifyLabel('northwind.example') })).toHaveAttribute('href', '/u/0/setup?step=record&domain=d-1');
    expect(main.queryByRole('button', { name: m.removeLabel('northwind.example') })).not.toBeInTheDocument();
  });

  it('makes a verified domain primary', async () => {
    const { api, user } = setup([primary, other]);
    await user.click(within(await card('studio.example')).getByRole('button', { name: m.makePrimary }));
    expect(api.tenants.domains.setPrimary).toHaveBeenCalledWith('t-1', 'd-2');
    expect(await screen.findByRole('status')).toHaveTextContent(m.madePrimary('studio.example'));
  });

  it('asks before removing a domain, and says why it could not be', async () => {
    const { api, user } = setup([primary, other], async () => {
      throw new ApiError({ status: 409, code: 'PRIMARY_DOMAIN_LOCKED', message: 'x' });
    });
    await user.click(within(await card('studio.example')).getByRole('button', { name: m.removeLabel('studio.example') }));
    const dialog = screen.getByRole('alertdialog', { name: m.removeTitle('studio.example') });
    await user.click(within(dialog).getByRole('button', { name: m.remove }));
    expect(api.tenants.domains.remove).toHaveBeenCalledWith('t-1', 'd-2');
    expect(await screen.findByRole('status')).toHaveTextContent(f.primaryLocked);
  });

  it('adds a domain, and refuses one that is not a domain', async () => {
    const { api, user } = setup([primary]);
    await user.type(await screen.findByRole('textbox', { name: m.addLabel }), 'https://x');
    await user.click(screen.getByRole('button', { name: m.add }));
    expect(screen.getByText(m.invalidDomain)).toBeInTheDocument();
    await user.clear(screen.getByRole('textbox', { name: m.addLabel }));
    await user.type(screen.getByRole('textbox', { name: m.addLabel }), 'New.Example');
    await user.click(screen.getByRole('button', { name: m.add }));
    expect(api.tenants.domains.add).toHaveBeenCalledWith('t-1', { domain: 'new.example', method: 'TXT', autoProvisionMode: 'off' });
    expect(await card('new.example')).toBeInTheDocument();
  });
});
