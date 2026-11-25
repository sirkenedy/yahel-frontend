import { describe, expect, it } from 'vitest';
import type { Session } from '@yahel/auth';
import { createAdminStore } from './features/admin/store';
import { createBusinessStore } from './features/business/store';
import { createPersonalStore } from './features/personal/store';
import { forgetOnRetry } from './route-error';

const sessionAs = (email: string | null) => ({ store: { getState: () => ({ status: email ? 'signed-in' : 'signed-out', profile: email ? { email } : null }) } }) as unknown as Session;

describe('forgetOnRetry', () => {
  it('forgets the admin flow, its address and its phone check, as well as the sign-ups, unless the tab is signed in as that administrator', () => {
    const admin = createAdminStore();
    admin.dispatch({ type: 'handed-over', handover: { email: 'amara@harbourline.example', organisation: 'Harbourline Studio', challengeToken: 'pc-1', phone: null, continueToPlan: true } });

    forgetOnRetry({ personal: createPersonalStore(), business: createBusinessStore(), admin, session: sessionAs('amara@harbourline.example') });
    expect(admin.getState().email).toBe('amara@harbourline.example');

    // Signed in as someone else is no different from signed out: the administrator's flow is not theirs.
    forgetOnRetry({ personal: createPersonalStore(), business: createBusinessStore(), admin, session: sessionAs('kemi.adeyemi@yahel.example') });
    expect(admin.getState()).toMatchObject({ email: null, handedOver: false, challengeToken: null });
  });
});
