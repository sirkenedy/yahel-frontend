import { describe, expect, it } from 'vitest';
import { crumbsOf, navHref, navIdOf, navItems, navPages } from './nav-tree';

describe('the Admin menu', () => {
  it('holds the whole designed tree, with built pages at their own addresses', () => {
    const items = navItems('2');
    expect(items.map((item) => item.label)).toEqual(['Home', 'Dashboard', 'Directory', 'Apps', 'Security', 'Data', 'Billing', 'Account']);
    expect(navHref('2', 'users')).toBe('/u/2/users');
    expect(navHref('2', 'domManage')).toBe('/u/2/domains');
    expect(navHref('2', 'alerts')).toBe('/u/2/later/alerts');
    expect(navPages('2')).toHaveLength(48);
  });

  it('knows which page an address shows', () => {
    expect(navIdOf('/u/0/')).toBe('home');
    expect(navIdOf('/u/0')).toBe('home');
    expect(navIdOf('/u/0/users/m-1')).toBe('users');
    expect(navIdOf('/u/0/later/sso')).toBe('sso');
    expect(navIdOf('/u/0/later/nothing')).toBeNull();
    expect(navIdOf('/u/0/setup')).toBeNull();
  });

  it('gives a page its trail', () => {
    expect(crumbsOf('1', 'sso')).toEqual([{ label: 'Security' }, { label: 'Authentication' }, { label: 'Single sign-on', href: '/u/1/later/sso' }]);
  });
});
