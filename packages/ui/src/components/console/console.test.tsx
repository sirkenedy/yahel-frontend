import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AdminMark } from './admin-mark';
import { ConsoleNav, pathTo } from './console-nav';
import type { ConsoleNavItem } from './console-nav';
import { ConsolePage, ConsolePlaceholder, StatusTag } from './console-page';
import { ConsoleSearch } from './console-search';
import { ConsoleShell } from './console-shell';
import { SetupRail } from './setup';
import { DataTable } from './data-table';

const items: ConsoleNavItem[] = [
  { id: 'home', label: 'Home', icon: 'home', href: '/home' },
  {
    id: 'directory',
    label: 'Directory',
    icon: 'people',
    children: [
      { id: 'users', label: 'Users', href: '/users' },
      { id: 'groups', label: 'Groups', href: '/groups' },
    ],
  },
  { id: 'security', label: 'Security', icon: 'shield', children: [{ id: 'auth', label: 'Authentication', children: [{ id: 'sso', label: 'Single sign-on', href: '/sso' }] }] },
];

describe('AdminMark', () => {
  it('reads as one name and shows where the person is', () => {
    render(<AdminMark label="Yahel Admin" word="yahel" product="admin" context="Domain setup" />);
    expect(screen.getByRole('img', { name: 'Yahel Admin' })).toBeInTheDocument();
    expect(screen.getByText('Domain setup')).toBeInTheDocument();
  });
});

describe('ConsoleNav', () => {
  it('opens the groups that hold the current page and marks it', () => {
    render(<ConsoleNav label="Admin console" heading="Northwind Studio" items={items} currentId="users" />);
    const nav = screen.getByRole('navigation', { name: 'Admin console' });
    expect(within(nav).getByRole('button', { name: 'Directory' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(nav).getByRole('link', { name: 'Users' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'Security' })).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).queryByRole('link', { name: 'Single sign-on' })).not.toBeInTheDocument();
  });

  it('opens and closes a group a level at a time', async () => {
    render(<ConsoleNav label="Admin console" items={items} currentId="home" />);
    await userEvent.click(screen.getByRole('button', { name: 'Security' }));
    await userEvent.click(screen.getByRole('button', { name: 'Authentication' }));
    expect(screen.getByRole('link', { name: 'Single sign-on' })).toHaveAttribute('href', '/sso');
    await userEvent.click(screen.getByRole('button', { name: 'Security' }));
    expect(screen.queryByRole('button', { name: 'Authentication' })).not.toBeInTheDocument();
  });

  it('widens itself before opening a group pressed while narrowed', async () => {
    const onExpand = vi.fn();
    render(<ConsoleNav label="Admin console" items={items} currentId="home" collapsed onExpand={onExpand} />);
    await userEvent.click(screen.getByRole('button', { name: 'Directory' }));
    expect(onExpand).toHaveBeenCalledOnce();
  });

  it('finds the trail to a page', () => {
    expect(pathTo(items, 'sso').map((item) => item.id)).toEqual(['security', 'auth', 'sso']);
    expect(pathTo(items, 'missing')).toEqual([]);
  });
});

describe('ConsoleSearch', () => {
  const pages = [
    { id: 'users', label: 'Users', detail: 'Directory › Users' },
    { id: 'sso', label: 'Single sign-on', detail: 'Security › Authentication › Single sign-on', keywords: 'saml' },
  ];

  it('jumps to what is picked', async () => {
    const onSelect = vi.fn();
    render(<ConsoleSearch label="Search the Admin console" placeholder="Search people, settings and help" emptyLabel="Nothing matches" items={pages} onSelect={onSelect} />);
    await userEvent.type(screen.getByRole('combobox', { name: 'Search the Admin console' }), 'saml');
    await userEvent.click(await screen.findByRole('option', { name: /Single sign-on/ }));
    expect(onSelect).toHaveBeenCalledWith('sso');
  });

  it('says when nothing matches', async () => {
    render(<ConsoleSearch label="Search" placeholder="Search" emptyLabel="Nothing matches" items={pages} onSelect={vi.fn()} />);
    await userEvent.type(screen.getByRole('combobox', { name: 'Search' }), 'billing');
    expect(await screen.findByText('Nothing matches')).toBeInTheDocument();
  });
});

describe('ConsoleShell', () => {
  it('narrows and widens the side menu from the menu button', async () => {
    render(
      <ConsoleShell labels={{ skip: 'Skip to content', showMenu: 'Show menu', hideMenu: 'Hide menu' }} brand="Brand" nav={({ collapsed, id }) => <ConsoleNav id={id} label="Admin console" items={items} currentId="home" collapsed={collapsed} />}>
        Page
      </ConsoleShell>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Hide menu' }));
    expect(screen.getByRole('navigation', { name: 'Admin console' })).toHaveAttribute('data-collapsed');
    await userEvent.click(screen.getByRole('button', { name: 'Show menu' }));
    expect(screen.getByRole('navigation', { name: 'Admin console' })).not.toHaveAttribute('data-collapsed');
    expect(screen.getByRole('main')).toHaveTextContent('Page');
  });
});

describe('ConsolePage and its parts', () => {
  it('names the page, where it is, and what comes later', () => {
    render(
      <ConsolePage crumbs={[{ label: 'Security' }, { label: 'Alert center' }]} crumbsLabel="Breadcrumb" title="Alert center" lede="Warnings that need a look.">
        <ConsolePlaceholder title="Coming in a later version" planned={['Audit log']} plannedLabel="Planned">
          Its screens come later.
        </ConsolePlaceholder>
        <StatusTag tone="success">Active</StatusTag>
      </ConsolePage>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Alert center' })).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByText('Alert center')).toHaveAttribute('aria-current', 'page');
    expect(within(screen.getByRole('list', { name: 'Planned' })).getByText('Audit log')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});

describe('SetupRail', () => {
  it('says which steps are done and which is current, not by colour alone', () => {
    render(
      <SetupRail
        label="Setup steps"
        doneLabel="done"
        nowLabel="current step"
        steps={[
          { label: 'Verify domain', state: 'done' },
          { label: 'Switch on mail', state: 'now' },
          { label: 'Protect mail', state: 'next' },
        ]}
      />,
    );
    const items = within(screen.getByRole('list', { name: 'Setup steps' })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Verify domain, done');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[2]).toHaveTextContent('3Protect mail');
  });
});

describe('DataTable', () => {
  const rows = [
    { id: 'a', name: 'Amara', role: 'Admin' },
    { id: 'b', name: 'Tunde', role: 'User' },
  ];
  const columns = [
    { id: 'name', header: 'Name', cell: (row: (typeof rows)[number]) => row.name },
    { id: 'role', header: 'Role', cell: (row: (typeof rows)[number]) => row.role, secondary: true },
  ];

  it('names each row with a link to its page', () => {
    render(<DataTable label="Users" columns={columns} rows={rows} rowKey={(row) => row.id} rowHref={(row) => `/users/${row.id}`} />);
    const table = screen.getByRole('table', { name: 'Users' });
    expect(within(table).getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
    expect(within(table).getByRole('link', { name: 'Tunde' })).toHaveAttribute('href', '/users/b');
    expect(within(table).getByRole('rowheader', { name: 'Amara' })).toBeInTheDocument();
  });

  it('shows what it is given when there are no rows', () => {
    render(<DataTable label="Users" columns={columns} rows={[]} rowKey={(row) => row.id} rowHref={() => '/'} empty="No one yet" />);
    expect(screen.getByText('No one yet')).toBeInTheDocument();
  });
});
