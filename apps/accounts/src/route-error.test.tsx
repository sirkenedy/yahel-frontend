import { describe, expect, it } from 'vitest';
import type { Session } from '@yahel/auth';
import { createAdminStore } from './features/admin/store';
import { createBusinessStore } from './features/business/store';
import { createPersonalStore } from './features/personal/store';
import { forgetOnRetry } from './route-error';

const sessionIn = (status: 'signed-in' | 'signed-out') => ({ store: { getState: () => ({ status }) } }) as unknown as Session;

describe('forgetOnRetry', () => {
  it('forgets the admin flow, its address and its phone check, as well as the sign-ups, unless someone is signed in', () => {
    const admin = createAdminStore();
    admin.dispatch({ type: 'handed-over', handover: { email: 'amara@harbourline.example', organisation: 'Harbourline Studio', challengeToken: 'pc-1', phone: null, continueToPlan: true } });

    forgetOnRetry({ personal: createPersonalStore(), business: createBusinessStore(), admin, session: sessionIn('signed-in') });
    expect(admin.getState().email).toBe('amara@harbourline.example');

    forgetOnRetry({ personal: createPersonalStore(), business: createBusinessStore(), admin, session: sessionIn('signed-out') });
    expect(admin.getState()).toMatchObject({ email: null, handedOver: false, challengeToken: null });
  });
});
