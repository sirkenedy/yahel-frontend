import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@yahel/api-client';
import type { WorkspaceDomain } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { describe, expect, it, vi } from 'vitest';
import { DomainSetup, setupDomainOf } from './domain-setup';
import type { SetupStep } from './domain-setup';
import { setupMessages as m } from './messages';

const pending: WorkspaceDomain = { _id: 'd-1', domain: 'northwind.example', method: 'TXT', status: 'pending', isPrimary: true, verificationToken: 'yahel-verification=abc123' };
const other: WorkspaceDomain = { _id: 'd-2', domain: 'studio.example', method: 'TXT', status: 'verified', isPrimary: false };

const setup = (step: SetupStep, verify: () => Promise<unknown>, domains: WorkspaceDomain[] = [pending]) => {
  const api = { tenants: { domains: { list: vi.fn(async () => domains), verify: vi.fn(verify) } } };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <DomainSetup session={{ api } as unknown as Session} tenantId="t-1" slot="0" step={step} links={{ helpUrl: null, privacyUrl: null, termsUrl: null }} />
    </QueryClientProvider>,
  );
  return { api, user: userEvent.setup() };
};

describe('DomainSetup', () => {
  it('starts with the three steps, saying which come later', async () => {
    setup('intro', async () => ({}));
    expect(await screen.findByRole('heading', { level: 1, name: m.introTitle('northwind.example') })).toBeInTheDocument();
    expect(screen.getAllByText(m.later)).toHaveLength(2);
    expect(screen.getByRole('link', { name: m.getStarted })).toHaveAttribute('href', '/u/0/setup?step=record');
    expect(screen.getByRole('list', { name: m.rail })).toHaveTextContent(m.steps.verify);
  });

  it('shows the TXT record to copy, then says when it is not found yet', async () => {
    const { api, user } = setup('record', async () => {
      throw new ApiError({ status: 400, code: 'DOMAIN_NOT_VERIFIED', message: 'x' });
    });
    expect(await screen.findByText('yahel-verification=abc123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: m.copyWhat(m.value) })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: m.check }));
    expect(api.tenants.domains.verify).toHaveBeenCalledWith('t-1', 'd-1');
    expect(await screen.findByRole('heading', { level: 1, name: m.notFoundTitle })).toBeInTheDocument();
    expect(screen.getByText(/^Last checked at /)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: m.showRecords }));
    expect(await screen.findByRole('heading', { level: 1, name: m.recordTitle })).toBeInTheDocument();
  });

  it('says the domain is verified when the record is found', async () => {
    const { user } = setup('record', async () => ({ verified: true }));
    await user.click(await screen.findByRole('button', { name: m.check }));
    expect(await screen.findByRole('heading', { level: 1, name: m.verifiedTitle('northwind.example') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.switchOnMail })).toHaveAttribute('href', '/u/0/setup?step=mail');
  });

  it('keeps the record in view when DNS cannot be read, with what happened', async () => {
    const { user } = setup('record', async () => {
      throw new ApiError({ status: 503, code: 'SERVICE_UNAVAILABLE', message: 'x' });
    });
    await user.click(await screen.findByRole('button', { name: m.check }));
    expect(await screen.findByRole('alert')).toHaveTextContent('DNS could not be checked just now');
    expect(screen.getByRole('heading', { level: 1, name: m.recordTitle })).toBeInTheDocument();
  });

  it('does not pretend to switch on mail', async () => {
    setup('mail', async () => ({}));
    expect(await screen.findByRole('heading', { level: 1, name: m.mailTitle })).toBeInTheDocument();
    expect(screen.getByText(m.later)).toBeInTheDocument();
  });

  it('sets up the primary domain while it still needs verifying, else the first that does', () => {
    expect(setupDomainOf([other, pending])?._id).toBe('d-1');
    expect(setupDomainOf([{ ...other, isPrimary: true }, { ...pending, isPrimary: false }])?._id).toBe('d-1');
    expect(setupDomainOf([other], 'd-2')?._id).toBe('d-2');
    expect(setupDomainOf([])).toBeNull();
  });
});
