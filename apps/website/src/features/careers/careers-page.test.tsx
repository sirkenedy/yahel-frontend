import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CareersPage } from './careers-page';

const roles = () => within(screen.getByRole('tabpanel')).getAllByRole('link');
const teamsShown = () => roles().map((role) => within(role).getByText(/ · /).textContent);

describe('CareersPage', () => {
  it('has one level-one heading and its sections in reading order', () => {
    render(<CareersPage />);

    expect(screen.getAllByRole('heading').map((heading) => `${heading.tagName} ${heading.textContent}`)).toEqual([
      'H1 Build the tools people open every day.',
      'H2 How we work',
      'H3 [HOW YOU WORK 1]',
      'H3 [HOW YOU WORK 2]',
      'H3 [BENEFITS]',
      'H2 Open roles',
    ]);
    expect(screen.getByText('Careers')).toBeInTheDocument();
    expect(screen.getByText('Join the team making mail, files, documents and meetings work as one product.')).toBeInTheDocument();
  });

  it('names the document for this page', () => {
    render(<CareersPage />);

    expect(document.title).toBe('Careers at Yahel');
  });

  it('leads from the hero to the open roles on the same page', () => {
    render(<CareersPage />);

    expect(screen.getByRole('link', { name: 'See open roles' })).toHaveAttribute('href', '#roles');
    expect(screen.getByRole('heading', { level: 2, name: 'Open roles' }).closest('section')).toHaveAttribute('id', 'roles');
  });

  it('shows how the team works as marked placeholders, exactly as written', () => {
    render(<CareersPage />);

    expect(screen.getByText('[One or two sentences: for example where and when people work.]')).toBeInTheDocument();
    expect(screen.getByText('[One or two sentences: for example how decisions are made.]')).toBeInTheDocument();
    expect(screen.getByText('[What you offer: pay, leave, equipment, learning.]')).toBeInTheDocument();
  });

  it('offers a tab for every team, and shows all four roles first', () => {
    render(<CareersPage />);

    expect(within(screen.getByRole('tablist', { name: 'Team' })).getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['All', 'Engineering', 'Design', 'Operations']);
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'true');
    expect(teamsShown()).toEqual(['Engineering · [LOCATION]', 'Engineering · [LOCATION]', 'Design · [LOCATION]', 'Operations · [LOCATION]']);
  });

  it.each([
    ['Engineering', 2],
    ['Design', 1],
    ['Operations', 1],
  ])('shows only the roles of %s when that team is chosen', async (team, count) => {
    render(<CareersPage />);

    await userEvent.click(screen.getByRole('tab', { name: team }));

    expect(teamsShown()).toEqual(Array.from({ length: count }, () => `${team} · [LOCATION]`));
  });

  it('shows every role again when All is chosen after a team', async () => {
    render(<CareersPage />);
    await userEvent.click(screen.getByRole('tab', { name: 'Design' }));

    await userEvent.click(screen.getByRole('tab', { name: 'All' }));

    expect(roles()).toHaveLength(4);
  });

  it('writes each role as a placeholder title, its team and place, and a link to view it', () => {
    render(<CareersPage />);

    for (const role of roles()) {
      expect(role).toHaveAccessibleName(/^\[ROLE TITLE\] (Engineering|Design|Operations) · \[LOCATION\] View role$/);
      expect(role).toHaveAttribute('href', '#roles');
    }
  });

  it('says where to write when nothing fits, with the address still a placeholder', () => {
    render(<CareersPage />);

    expect(screen.getByText('Nothing that fits? Write to [CAREERS EMAIL] and tell us what you do well.')).toBeInTheDocument();
  });
});
