import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { bulkMessages as b, personWords as w, usersMessages as m } from './messages';
import { testSession, invited, member, owner, suspended } from './test-session';
import { UsersPage } from './users-page';
import type { UsersSearch } from './users-page';

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));

const designer = member({ _id: 'm-5', globalIdentityId: 'g-5', ouPath: '/lagos/design' });
const lagos = member({ _id: 'm-6', globalIdentityId: 'g-6', ouPath: '/lagos' });

function Page({ session }: { session: ReturnType<typeof testSession>['session'] }) {
  const [search, setSearch] = useState<UsersSearch>({ q: '', status: 'all', units: [], pick: 'one' });
  return <UsersPage session={session} tenantId="t-1" organisation="Northwind Studio" slot="0" crumbs={[]} crumbsLabel="Breadcrumb" search={search} onSearch={setSearch} />;
}

const bodyRows = () => within(screen.getByRole('table', { name: m.table })).getAllByRole('row').slice(1);

describe('UsersPage', () => {
  it('lists everyone with unit, role, status and last sign-in, and counts each status', async () => {
    const { session, wrapper } = testSession([invited, owner, suspended]);
    render(<Page session={session} />, { wrapper });
    await screen.findByRole('table', { name: m.table });
    const rows = bodyRows();
    expect(rows[0]).toHaveTextContent('Amara Okafor');
    expect(rows[0]).toHaveTextContent('Northwind Studio');
    expect(within(rows[0]!).getByRole('link', { name: /Amara Okafor/ })).toHaveAttribute('href', '/u/0/users/m-me');
    expect(rows[1]).toHaveTextContent(w.status.invited);
    expect(screen.getByText(m.count(3, 0, 'Northwind Studio'))).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Suspended/ }).closest('label')).toHaveTextContent('1');
    expect(screen.getByText(m.scope.everyone('Northwind Studio'))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: m.add })).toHaveAttribute('href', '/u/0/users/add');
  });

  it('narrows by status, and offers everyone again when a search finds no one', async () => {
    const { session, wrapper } = testSession([invited, owner, suspended]);
    render(<Page session={session} />, { wrapper });
    await screen.findByRole('table');
    await userEvent.click(screen.getByRole('radio', { name: /Invited/ }));
    expect(bodyRows()).toHaveLength(1);
    await userEvent.type(screen.getByRole('searchbox', { name: m.search }), 'zainab');
    expect(screen.getByText(m.noMatchTitle('zainab'))).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: m.showAll }));
    expect(bodyRows()).toHaveLength(3);
  });

  it('shows the people in a unit and the units inside it, then several units', async () => {
    const { session, wrapper } = testSession([owner, designer, lagos]);
    render(<Page session={session} />, { wrapper });
    const tree = await screen.findByRole('radiogroup', { name: m.units.tree });
    await userEvent.click(within(tree).getByRole('radio', { name: /Lagos office/ }));
    expect(bodyRows()).toHaveLength(2);
    expect(screen.getByRole('button', { name: m.scope.stop('Lagos office') })).toHaveTextContent(m.scope.withInside('Lagos office'));
    expect(screen.getByText(m.shownOf(2, 3))).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: m.units.several }));
    await userEvent.click(within(screen.getByRole('group', { name: m.units.tree })).getByRole('checkbox', { name: /Guests/ }));
    expect(screen.getByText(m.scope.several(2))).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: m.scope.stop('Lagos office') }));
    expect(screen.getByText(m.noneInUnits)).toBeInTheDocument();
  });

  it('moves the selected people to a unit, and keeps suspend and delete off when yourself is selected', async () => {
    const { session, wrapper, api } = testSession([owner, designer, lagos]);
    render(<Page session={session} />, { wrapper });
    await screen.findByRole('table');
    await userEvent.click(screen.getByRole('checkbox', { name: m.selectAll }));
    const bar = screen.getByRole('toolbar', { name: b.label });
    expect(bar).toHaveTextContent(b.count(3));
    expect(within(bar).getByRole('button', { name: b.delete })).toBeDisabled();
    expect(screen.getByText(new RegExp(b.locked))).toBeInTheDocument();
    await userEvent.click(within(bar).getByRole('button', { name: b.move }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Design team' }));
    expect(api.tenants.members.changeUnit).toHaveBeenCalledTimes(3);
    expect(api.tenants.members.changeUnit).toHaveBeenCalledWith('t-1', 'm-6', 'ou-design');
  });

  it('suspends the selected people after asking', async () => {
    const suspend = vi.fn(async () => ({}));
    const { session, wrapper } = testSession([owner, designer, lagos], { suspend });
    render(<Page session={session} />, { wrapper });
    await screen.findByRole('table');
    await userEvent.click(screen.getAllByRole('checkbox', { name: m.select(w.unnamed) })[0]!);
    await userEvent.click(screen.getByRole('button', { name: b.suspend }));
    const dialog = screen.getByRole('alertdialog', { name: b.suspendTitle(1) });
    await userEvent.click(within(dialog).getByRole('button', { name: b.suspend }));
    expect(suspend).toHaveBeenCalledTimes(1);
  });
});
