import { describe, expect, it } from 'vitest';
import { actionMessages as m } from './messages';
import { personOf } from './people';
import { admin, invited, me, member, owner } from './test-session';
import { failureOf, lockOf } from './user-actions';
import { ApiError } from '@yahel/api-client';

const user = member({ _id: 'm-5', globalIdentityId: 'g-5' });
const everyone = [owner, admin, invited, user].map((one) => personOf(one, me));
const at = (id: string) => everyone.find((person) => person.member._id === id)!;

describe('lockOf', () => {
  it('finds why a person cannot be changed', () => {
    expect(lockOf(at('m-me'), everyone, 'Amara')).toBe(m.why.owner);
    expect(lockOf(personOf(admin, { ...me, id: 'g-3' }), everyone, 'x')).toBe(m.why.you);
    const alone = [personOf(member({ _id: 'm-9', globalIdentityId: 'g-9', role: 'ADMIN' }), me)];
    expect(lockOf(alone[0]!, alone, 'Kofi')).toBe(m.why.lastAdmin('Kofi'));
    expect(lockOf(at('m-5'), everyone, 'x')).toBeNull();
  });
});

describe('failureOf', () => {
  it('says what went wrong without server details', () => {
    expect(failureOf(new ApiError({ status: 409, code: 'SEAT_LIMIT_REACHED', message: 'x' }))).toBe(m.failed.seats);
    expect(failureOf(new ApiError({ status: 0, code: 'NETWORK', message: 'x' }))).toBe(m.failed.offline);
    expect(failureOf(new Error('boom'))).toBe(m.failed.server);
  });
});
