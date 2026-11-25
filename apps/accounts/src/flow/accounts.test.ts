import { describe, expect, it } from 'vitest';
import type { SessionState } from '@yahel/auth';
import { badgeOf, isSignedInAs, kindOfStanding, statusOf } from './accounts';

const words = { personal: 'Personal', work: 'Work account', signedOut: 'Signed out', personalAccount: 'Personal account', workAccount: 'Work account', admin: (organisation: string) => `Admin · ${organisation}` };

describe('statusOf', () => {
  it('names the organisation, else the kind of account, while signed in', () => {
    expect(statusOf({ signedIn: true, organisation: 'Northwind Studio', kind: 'business' }, words)).toBe('Northwind Studio');
    expect(statusOf({ signedIn: true, organisation: null, kind: 'business' }, words)).toBe('Work account');
    expect(statusOf({ signedIn: true, organisation: null, kind: 'personal' }, words)).toBe('Personal');
    expect(statusOf({ signedIn: false, organisation: 'Northwind Studio', kind: 'business' }, words)).toBe('Signed out');
  });
});

describe('badgeOf', () => {
  it('says admin, the organisation, work account or personal account', () => {
    expect(badgeOf({ type: 'admin', organisation: 'Northwind Studio' }, words)).toBe('Admin · Northwind Studio');
    expect(badgeOf({ type: 'member', organisation: 'Northwind Studio' }, words)).toBe('Northwind Studio');
    expect(badgeOf({ type: 'work' }, words)).toBe('Work account');
    expect(badgeOf({ type: 'personal' }, words)).toBe('Personal account');
  });
});

describe('kindOfStanding', () => {
  it('shows an organisation face for any work account, and a person until known', () => {
    expect(kindOfStanding({ type: 'work' })).toBe('organisation');
    expect(kindOfStanding({ type: 'personal' })).toBe('person');
    expect(kindOfStanding(null)).toBe('person');
  });
});

describe('isSignedInAs', () => {
  const as = (status: SessionState['status'], email: string | null) => ({ status, profile: email ? ({ email } as SessionState['profile']) : null });

  it('is the account asked for, whatever the case of its address, or anyone when none is', () => {
    expect(isSignedInAs(as('signed-in', 'amara@northwind.example'), 'Amara@Northwind.example')).toBe(true);
    expect(isSignedInAs(as('signed-in', 'kayode@personal.example'), 'amara@northwind.example')).toBe(false);
    expect(isSignedInAs(as('signed-in', 'kayode@personal.example'), null)).toBe(true);
    expect(isSignedInAs(as('signed-out', null), null)).toBe(false);
  });
});
