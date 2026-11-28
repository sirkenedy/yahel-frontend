import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { personWords as w, userMessages as m } from './messages';
import { testSession, invited, owner } from './test-session';
import { UserPage } from './user-page';

describe('UserPage', () => {
  it('shows the facts the API has about a person', async () => {
    const { session, wrapper } = testSession([owner, invited]);
    render(<UserPage session={session} tenantId="t-1" memberId="m-2" slot="0" crumbs={[{ label: 'Users' }]} crumbsLabel="Breadcrumb" />, { wrapper });
    expect(await screen.findByRole('heading', { level: 1, name: w.unnamed })).toBeInTheDocument();
    expect(screen.getByText(m.facts.inviteExpires)).toBeInTheDocument();
    expect(screen.getAllByText(w.status.invited).length).toBeGreaterThan(0);
    expect(screen.getByText(m.securityLater)).toBeInTheDocument();
  });

  it('names the signed-in administrator', async () => {
    const { session, wrapper } = testSession([owner]);
    render(<UserPage session={session} tenantId="t-1" memberId="m-me" slot="0" crumbs={[]} crumbsLabel="Breadcrumb" />, { wrapper });
    expect(await screen.findByRole('heading', { level: 1, name: 'Amara Okafor' })).toBeInTheDocument();
    expect(screen.getAllByText('amara@northwind.example').length).toBeGreaterThan(0);
  });

  it('says when the person is no longer in the organisation', async () => {
    const { session, wrapper } = testSession([owner]);
    render(<UserPage session={session} tenantId="t-1" memberId="m-gone" slot="0" crumbs={[]} crumbsLabel="Breadcrumb" />, { wrapper });
    expect(await screen.findByText(m.gone)).toBeInTheDocument();
  });
});
