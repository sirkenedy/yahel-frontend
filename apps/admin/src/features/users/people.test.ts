import { describe, expect, it } from 'vitest';
import { countsOf, filterPeople, personOf, whenOf } from './people';
import { invited, me, owner, suspended } from './test-session';

describe('people', () => {
  const people = [owner, invited, suspended].map((one) => personOf(one, me));

  it('knows the signed-in administrator by their identity, and nobody else’s name', () => {
    expect(people[0]).toMatchObject({ isYou: true, name: 'Amara Okafor', email: 'amara@northwind.example', initials: 'AO' });
    expect(people[1]).toMatchObject({ isYou: false, name: null, email: null });
  });

  it('counts each status for the chips', () => {
    expect(countsOf(people)).toEqual({ all: 3, active: 1, invited: 1, suspended: 1 });
  });

  it('filters by every word of the search and by the chip', () => {
    expect(filterPeople(people, 'amara', 'all')).toHaveLength(1);
    expect(filterPeople(people, 'okafor owner', 'all')).toHaveLength(1);
    expect(filterPeople(people, 'invited', 'all')).toEqual([people[1]]);
    expect(filterPeople(people, '', 'suspended')).toEqual([people[2]]);
    expect(filterPeople(people, 'zainab', 'all')).toEqual([]);
  });

  it('says today’s sign-ins as a time and older ones as a date', () => {
    const now = new Date('2026-11-20T15:00:00');
    expect(whenOf('2026-11-20T09:41:00', now)).toMatch(/^Today, /);
    expect(whenOf('2026-11-03T10:00:00', now)).toMatch(/2026/);
    expect(whenOf(null, now)).toBeNull();
  });
});
