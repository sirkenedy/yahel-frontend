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
import { ConsoleDialog } from './console-dialog';
import { ConsolePanel } from './console-panel';
import { BulkBar, ConsoleMenu, FilterChip, UnitTree } from './console-controls';

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

const labels = { skip: 'Skip to content', showMenu: 'Show menu', hideMenu: 'Hide menu', closeMenu: 'Close menu' };

describe('ConsoleShell', () => {
  it('opens the menu as a drawer on a narrow screen and closes it from its own header', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: true, media: query, addEventListener: () => undefined, removeEventListener: () => undefined })) as unknown as typeof window.matchMedia;
    try {
      render(
        <ConsoleShell labels={labels} brand="Brand" nav={({ collapsed, id }) => <ConsoleNav id={id} label="Admin console" items={items} currentId="home" collapsed={collapsed} />}>
          Page
        </ConsoleShell>,
      );
      expect(screen.getByRole('button', { name: 'Close menu', hidden: true }).closest('[inert]')).not.toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Show menu' }));
      await userEvent.click(screen.getByRole('button', { name: 'Close menu' }));
      expect(screen.getByRole('button', { name: 'Show menu' })).toHaveFocus();
      expect(screen.getByRole('button', { name: 'Show menu' })).toHaveAttribute('aria-expanded', 'false');
    } finally {
      window.matchMedia = original;
    }
  });

  it('narrows and widens the side menu from the menu button', async () => {
    render(
      <ConsoleShell labels={labels} brand="Brand" nav={({ collapsed, id }) => <ConsoleNav id={id} label="Admin console" items={items} currentId="home" collapsed={collapsed} />}>
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

describe('ConsoleDialog', () => {
  it('asks the question, states the consequence and closes with Escape', async () => {
    const onOpenChange = vi.fn();
    render(
      <ConsoleDialog isOpen onOpenChange={onOpenChange} title="Delete Tunde Bakare?" actions={<button type="button">Cancel</button>}>
        They lose access straight away.
      </ConsoleDialog>,
    );
    const dialog = screen.getByRole('alertdialog', { name: 'Delete Tunde Bakare?' });
    expect(dialog).toHaveTextContent('They lose access straight away.');
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('DataTable selection', () => {
  const rows = [
    { id: 'a', name: 'Amara' },
    { id: 'b', name: 'Tunde' },
  ];
  const columns = [{ id: 'name', header: 'Name', cell: (row: (typeof rows)[number]) => row.name }];

  it('ticks one row, then everyone shown, from the header box', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DataTable label="Users" columns={columns} rows={rows} rowKey={(row) => row.id} rowHref={() => '/'} selection={{ selected: new Set(), onChange, allLabel: 'Select everyone shown', rowLabel: (row) => `Select ${row.name}` }} />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Tunde' }));
    expect(onChange).toHaveBeenLastCalledWith(new Set(['b']));
    rerender(<DataTable label="Users" columns={columns} rows={rows} rowKey={(row) => row.id} rowHref={() => '/'} selection={{ selected: new Set(['b']), onChange, allLabel: 'Select everyone shown', rowLabel: (row) => `Select ${row.name}` }} />);
    const all = screen.getByRole('checkbox', { name: 'Select everyone shown' }) as HTMLInputElement;
    expect(all.indeterminate).toBe(true);
    await userEvent.click(all);
    expect(onChange).toHaveBeenLastCalledWith(new Set(['b', 'a']));
  });
});

describe('UnitTree', () => {
  const units = [
    { id: 'root', name: 'Northwind', parentId: null, count: 6 },
    { id: 'lagos', name: 'Lagos office', parentId: 'root', count: 4 },
    { id: 'design', name: 'Design team', parentId: 'lagos', count: 2 },
  ];

  it('picks one unit, or several, and folds a unit away', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<UnitTree label="Units" units={units} mode="one" selected={['root']} onChange={onChange} toggleLabel={(name, open) => `${open ? 'Collapse' : 'Expand'} ${name}`} />);
    await userEvent.click(screen.getByRole('radio', { name: /Lagos office/ }));
    expect(onChange).toHaveBeenLastCalledWith(['lagos']);
    rerender(<UnitTree label="Units" units={units} mode="several" selected={['lagos']} onChange={onChange} toggleLabel={(name, open) => `${open ? 'Collapse' : 'Expand'} ${name}`} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /Design team/ }));
    expect(onChange).toHaveBeenLastCalledWith(['lagos', 'design']);
    await userEvent.click(screen.getByRole('button', { name: 'Collapse Lagos office' }));
    expect(screen.queryByRole('checkbox', { name: /Design team/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Lagos office' })).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Selection bar, filter chips and menus', () => {
  it('acts on the selection and clears it', async () => {
    const onClear = vi.fn();
    const onRemove = vi.fn();
    const onAction = vi.fn();
    render(
      <>
        <BulkBar label="Actions for the selected people" count="2 people selected" clearLabel="Clear selection" onClear={onClear}>
          <ConsoleMenu look="bulk" label="Move to unit" items={[{ id: 'lagos', label: 'Lagos office' }, { id: 'x', label: 'Elsewhere', isDisabled: true }]} onAction={onAction} />
        </BulkBar>
        <FilterChip removeLabel="Stop filtering by Lagos office" onRemove={onRemove}>
          Lagos office
        </FilterChip>
      </>,
    );
    expect(screen.getByRole('toolbar', { name: 'Actions for the selected people' })).toHaveTextContent('2 people selected');
    await userEvent.click(screen.getByRole('button', { name: 'Move to unit' }));
    expect(screen.getByRole('menuitem', { name: 'Elsewhere' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Lagos office' }));
    expect(onAction).toHaveBeenCalledWith('lagos');
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onClear).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Stop filtering by Lagos office' }));
    expect(onRemove).toHaveBeenCalled();
  });
});

describe('ConsolePanel', () => {
  it('names what it changes and closes from its close button', async () => {
    const onOpenChange = vi.fn();
    render(
      <ConsolePanel isOpen onOpenChange={onOpenChange} title="Edit Kofi's details" lede="Name and profile." closeLabel="Close" actions={<button type="button">Save</button>}>
        Fields
      </ConsolePanel>,
    );
    const panel = screen.getByRole('dialog', { name: "Edit Kofi's details" });
    expect(panel).toHaveTextContent('Name and profile.');
    await userEvent.click(within(panel).getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
