import { describe, expect, it } from 'vitest';
import { createAdminStore } from './features/admin/store';
import { createBusinessStore } from './features/business/store';
import { createPersonalStore } from './features/personal/store';
import { forgetOnRetry } from './route-error';

describe('forgetOnRetry', () => {
  it('forgets the admin flow, its address and any proof it held, as well as the sign-ups', () => {
    const admin = createAdminStore();
    admin.dispatch({ type: 'handed-over', handover: { email: 'amara@harbourline.example', organisation: 'Harbourline Studio' } });
    admin.dispatch({ type: 'email-unconfirmed', password: 'Harbourline Lagos 2026!' });

    forgetOnRetry({ personal: createPersonalStore(), business: createBusinessStore(), admin });

    expect(admin.getState()).toMatchObject({ email: null, handedOver: false, provenPassword: null });
  });
});
