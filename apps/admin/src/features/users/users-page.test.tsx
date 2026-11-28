import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { personWords as w, usersMessages as m } from './messages';
import { testSession, invited, owner, suspended } from './test-session';
import { UsersPage } from './users-page';
import type { UsersSearch } from './users-page';

function Page({ session }: { session: ReturnType<typeof testSession>['session'] }) {
  const [search, setSearch] = useState<UsersSearch>({ q: '', status: 'all' });
  return <UsersPage session={session} tenantId="t-1" organisation="Northwind Studio" slot="0" crumbs={[]} crumbsLabel="Breadcrumb" search={search} onSearch={setSearch} />;
}

describe('UsersPage', () => {
  it('lists everyone with role, status and last sign-in, and counts each status', async () => {
    const { session, wrapper } = testSession([invited, owner, suspended]);
    render(<Page session={session} />, { wrapper });
    const table = await screen.findByRole('table', { name: m.table });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('Amara Okafor');
    expect(within(rows[0]!).getByRole('link', { name: 'Amara Okafor' })).toHaveAttribute('href', '/u/0/users/m-me');
    expect(rows[1]).toHaveTextContent(w.status.invited);
    expect(screen.getByText(m.count(3, 'Northwind Studio'))).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Suspended/ }).closest('label')).toHaveTextContent('1');
    expect(screen.getByText(m.namesNotice)).toBeInTheDocument();
  });

  it('narrows by status, and says when a search finds no one', async () => {
    const { session, wrapper } = testSession([invited, owner, suspended]);
    render(<Page session={session} />, { wrapper });
    await screen.findByRole('table');
    await userEvent.click(screen.getByRole('radio', { name: /Invited/ }));
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2);
    await userEvent.click(screen.getByRole('radio', { name: /All/ }));
    await userEvent.type(screen.getByRole('searchbox', { name: m.search }), 'zainab');
    expect(screen.getByText(m.noMatchTitle('zainab'))).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: m.clearSearch }));
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(4);
  });

  it('shows Add a person as not available yet', async () => {
    const { session, wrapper } = testSession([owner]);
    render(<Page session={session} />, { wrapper });
    expect(screen.getByRole('button', { name: m.add })).toBeDisabled();
    expect(screen.getByText(m.addLater)).toBeInTheDocument();
  });
});
