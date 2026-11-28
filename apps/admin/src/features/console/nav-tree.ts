import type { ConsoleCrumb, ConsoleNavItem, FlowIconName } from '@yahel/ui';
import { pathTo } from '@yahel/ui';
import { navWords } from './messages';

export type NavId = keyof typeof navWords;

interface Node {
  id: NavId;
  icon?: FlowIconName;
  kids?: readonly Node[];
}

/** The whole Workspace-style menu, as designed. Pages that are built have their own address; the rest open the "later" page. */
const tree: readonly Node[] = [
  { id: 'home', icon: 'home' },
  { id: 'dashboard', icon: 'dashboard' },
  {
    id: 'directory',
    icon: 'people',
    kids: [{ id: 'users' }, { id: 'guests' }, { id: 'groups' }, { id: 'audiences' }, { id: 'ous' }, { id: 'resources' }, { id: 'dirsettings' }, { id: 'extdirs' }, { id: 'unmanaged' }],
  },
  {
    id: 'apps',
    icon: 'grid',
    kids: [
      { id: 'appsOverview' },
      { id: 'yahelApps', kids: [{ id: 'status' }, { id: 'moderation' }, { id: 'appMail' }, { id: 'appCalendar' }, { id: 'appDrive' }, { id: 'appChat' }, { id: 'appMeet' }, { id: 'migrate' }] },
    ],
  },
  {
    id: 'security',
    icon: 'shield',
    kids: [
      { id: 'secOverview' },
      { id: 'advisor' },
      { id: 'alerts' },
      { id: 'auth', kids: [{ id: 'twoStep' }, { id: 'passkeys' }, { id: 'pwRules' }, { id: 'recovery' }, { id: 'sso' }] },
      { id: 'access', kids: [{ id: 'dlp' }, { id: 'apiAccess' }, { id: 'context' }, { id: 'session' }] },
    ],
  },
  {
    id: 'data',
    icon: 'database',
    kids: [{ id: 'dataOverview' }, { id: 'compliance', kids: [{ id: 'guides' }, { id: 'location' }, { id: 'cse' }] }, { id: 'impexp', kids: [{ id: 'import' }, { id: 'export' }, { id: 'download' }] }],
  },
  { id: 'billing', icon: 'card', kids: [{ id: 'subs' }, { id: 'payments' }, { id: 'buy' }, { id: 'upgradeSettings' }] },
  { id: 'account', icon: 'building', kids: [{ id: 'acctSettings' }, { id: 'roles' }, { id: 'domains', kids: [{ id: 'domOverview' }, { id: 'domManage' }, { id: 'allowlist' }] }] },
];

/** The pages with screens of their own, by the path after `/u/<slot>/`. */
const built = { home: '', users: 'users', appsOverview: 'apps', secOverview: 'security', subs: 'billing', domManage: 'domains' } as const satisfies Partial<Record<NavId, string>>;
type BuiltId = keyof typeof built;

const isBuilt = (id: string): id is BuiltId => id in built;
export const isNavId = (id: string): id is NavId => id in navWords;

/** The address of a page of the menu, as the account in `slot`. A page without screens opens the "later" page. */
export const navHref = (slot: string, id: NavId) => (isBuilt(id) ? `/u/${slot}/${built[id]}` : `/u/${slot}/later/${id}`);

/** The menu for the account in `slot`. */
export const navItems = (slot: string): ConsoleNavItem[] => {
  const build = (node: Node): ConsoleNavItem => ({
    id: node.id,
    label: navWords[node.id].label,
    icon: node.icon,
    ...(node.kids ? { children: node.kids.map(build) } : { href: navHref(slot, node.id) }),
  });
  return tree.map(build);
};

/** Which page of the menu an address shows: `/u/0/users/abc` is Users. */
export function navIdOf(pathname: string): NavId | null {
  const rest = pathname.replace(/^\/u\/[^/]+\/?/, '').replace(/\/$/, '');
  const [first, second] = rest.split('/');
  if (first === 'later') return second && isNavId(second) ? second : null;
  const found = (Object.entries(built) as [BuiltId, string][]).find(([, path]) => path === (first ?? ''));
  return found ? found[0] : null;
}

/** The trail to a page, as crumbs; a built page's crumb links to it. */
export const crumbsOf = (slot: string, id: NavId): ConsoleCrumb[] =>
  pathTo(navItems(slot), id).map((item) => ({ label: item.label, href: item.href }));

/** Every page of the menu, with where it sits, for the search. */
export const navPages = (slot: string) => {
  const pages: { id: NavId; label: string; detail: string; href: string }[] = [];
  const walk = (items: readonly ConsoleNavItem[], trail: string[]) => {
    for (const item of items) {
      if (item.children) walk(item.children, [...trail, item.label]);
      else if (item.href) pages.push({ id: item.id as NavId, label: item.label, detail: [...trail, item.label].join(' › '), href: item.href });
    }
  };
  walk(navItems(slot), []);
  return pages;
};
