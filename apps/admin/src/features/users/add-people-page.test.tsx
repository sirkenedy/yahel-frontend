import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AddPeoplePage, problemsOf, suggestUsername } from './add-people-page';
import { addMessages as m } from './messages';
import { owner, testSession } from './test-session';

const row = (over: Partial<Parameters<typeof problemsOf>[0][number]>) => ({ first: '', last: '', username: '', typed: false, domain: 'northwind.example', sendTo: '', ...over });

describe('AddPeoplePage', () => {
  it('suggests an address from the name', () => {
    expect(suggestUsername('Fémi', 'Adebayo-Cole')).toBe('femi.adebayocole');
    expect(suggestUsername('Kwame', '')).toBe('kwame');
  });

  it('says what to fix in each row', () => {
    expect(problemsOf([row({ last: 'Musa', username: 'musa' }), row({ first: 'Kofi', username: 'kofi', sendTo: 'kofi@example' }), row({})])).toEqual({ 0: m.needFirst(1), 1: m.badEmail(2) });
  });

  it('adds a row as one is filled in, and keeps adding people off until the server can create accounts', async () => {
    const { session, wrapper } = testSession([owner]);
    render(<AddPeoplePage session={session} tenantId="t-1" slot="0" crumbs={[]} crumbsLabel="Breadcrumb" />, { wrapper });
    const list = screen.getByRole('list', { name: m.rows });
    await userEvent.type(within(list).getAllByRole('textbox', { name: m.first })[0]!, 'Femi');
    await userEvent.type(within(list).getAllByRole('textbox', { name: m.last })[0]!, 'Adebayo');
    expect(within(list).getAllByRole('textbox', { name: m.username })[0]).toHaveValue('femi.adebayo');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(m.ready(1))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: m.add(1) })).toBeDisabled();
    expect(screen.getByText(m.later)).toBeInTheDocument();
  });
});
