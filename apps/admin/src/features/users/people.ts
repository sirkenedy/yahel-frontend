import type { MemberStatus, Profile, WorkspaceMember } from '@yahel/api-client';
import { personWords as w } from './messages';

/** A member as Admin shows them: the name and address are known only for the signed-in administrator. */
export interface Person {
  member: WorkspaceMember;
  isYou: boolean;
  name: string | null;
  email: string | null;
  initials: string | null;
}

export const personOf = (member: WorkspaceMember, me: Profile | null): Person => {
  const isYou = !!me && member.globalIdentityId === me.id;
  if (!isYou || !me) return { member, isYou, name: null, email: null, initials: null };
  const name = me.displayName?.trim() || [me.firstName, me.lastName].filter(Boolean).join(' ') || me.email;
  const initials = [me.firstName, me.lastName].map((part) => part?.trim()[0]).filter(Boolean).join('').toUpperCase() || name[0]!.toUpperCase();
  return { member, isYou, name, email: me.email, initials };
};

export const nameOf = (person: Person) => person.name ?? w.unnamed;

export type StatusFilter = 'all' | Exclude<MemberStatus, 'removed'>;
export const statusFilters: readonly StatusFilter[] = ['all', 'active', 'invited', 'suspended'];

/** How many people each chip would show. */
export const countsOf = (people: readonly Person[]) => {
  const counts: Record<StatusFilter, number> = { all: people.length, active: 0, invited: 0, suspended: 0 };
  for (const { member } of people) if (member.status !== 'removed') counts[member.status] += 1;
  return counts;
};

const fold = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** The people a search and a status chip leave: every word of the search must appear in the name, the address, the unit, the role or the status. */
export const filterPeople = (people: readonly Person[], query: string, status: StatusFilter, unitOf: (person: Person) => string = () => '') => {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return people.filter((person) => {
    const { member, name, email } = person;
    if (status !== 'all' && member.status !== status) return false;
    const text = fold([name, email, unitOf(person), w.role[member.role], w.status[member.status]].filter(Boolean).join(' '));
    return words.every((word) => text.includes(word));
  });
};

const day = (date: Date) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
const time = (date: Date) => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);

/** A date as a person reads it, in their own time zone: "Today, 09:41" or "3 Nov 2026". */
export const whenOf = (value: string | null | undefined, now = new Date()) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toDateString() === now.toDateString() ? w.today(time(date)) : day(date);
};

export const dayOf = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : day(date);
};

export const statusTone = { active: 'success', invited: 'info', suspended: 'warning', removed: 'neutral' } as const;
export const statusIcon = { active: 'check-circle', invited: 'mail', suspended: 'pause', removed: 'close' } as const;
