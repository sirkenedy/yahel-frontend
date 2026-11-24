import { createAccountCapabilities } from '@yahel/api-client';
import { createStandIns } from '@yahel/api-client/standins';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { ClientAccount, Profile } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { businessFacts, forgetWorkspace, handoverOf, isOffered, prefillFromAccount, prefillOf, stepInsteadOf } from './route-guard';
import { createBusinessStore } from './store';

const api = { auth: {} } as never;
const signedOut = { store: { getState: () => ({ status: 'signed-out', profile: null }) } } as unknown as Session;

describe('businessFacts', () => {
  it('offers the whole designed flow where something answers for plans and domains', () => {
    expect(businessFacts({ capabilities: createAccountCapabilities(api, createStandIns()), session: signedOut })).toEqual({ domainsForSale: true, billing: true, signedIn: false });
  });

  it('offers neither a domain to buy nor a checkout where nothing does', () => {
    expect(businessFacts({ capabilities: createAccountCapabilities(api), session: signedOut })).toEqual({ domainsForSale: false, billing: false, signedIn: false });
  });

  it('does not sell a domain where there is nowhere to pay for it', () => {
    const capabilities = { ...createAccountCapabilities(api, createStandIns()), workspaceBilling: null };
    expect(businessFacts({ capabilities, session: signedOut })).toEqual({ domainsForSale: false, billing: false, signedIn: false });
  });
});

describe('the guards', () => {
  it('lets the flow be shown only where this build offers it', () => {
    expect(isOffered({ config: { businessSignUp: true } })).toBe(true);
    expect(isOffered({ config: { businessSignUp: false } })).toBe(false);
  });

  it('says which step to show instead, or nothing when the step can be shown', () => {
    const store = createBusinessStore();
    const facts = { domainsForSale: true, billing: true, signedIn: false };
    expect(stepInsteadOf('start', store, facts)).toBeNull();
    expect(stepInsteadOf('checkout', store, facts)).toBe('start');
    store.dispatch({ type: 'business-entered', businessName: 'Northwind Studio', size: 'small', country: 'NG' });
    expect(stepInsteadOf('you', store, facts)).toBeNull();
  });

  it('forgets every answer, unless a workspace exists and that is to be spared', () => {
    const store = createBusinessStore();
    store.dispatch({ type: 'business-entered', businessName: 'Northwind Studio', size: 'small', country: 'NG' });
    store.dispatch({ type: 'admin-entered', adminUser: 'amara', password: 'Northwind Lagos 2026!', marketing: { productNews: false, teamTips: false } });
    forgetWorkspace(store, { unlessUnderway: true });
    expect(store.getState()).toMatchObject({ businessName: '', password: null });

    store.dispatch({ type: 'business-entered', businessName: 'Northwind Studio', size: 'small', country: 'NG' });
    store.dispatch({ type: 'workspace-created', tenantId: 't1', challengeToken: 'pc-1' });
    forgetWorkspace(store, { unlessUnderway: true });
    expect(store.getState().businessName).toBe('Northwind Studio');
    forgetWorkspace(store);
    expect(store.getState().businessName).toBe('');
  });

  it('hands the new administrator’s address, the business’s name and the phone check, never the password, to Admin’s first steps once the workspace is made', () => {
    const store = createBusinessStore();
    store.dispatch({ type: 'business-entered', businessName: 'Northwind Studio', size: 'small', country: 'NG' });
    store.dispatch({ type: 'owned-domain-entered', domain: 'northwind.example' });
    store.dispatch({ type: 'admin-entered', adminUser: 'amara', password: 'Northwind Lagos 2026!', marketing: { productNews: false, teamTips: false } });
    expect(handoverOf(store, true)).toBeNull();

    store.dispatch({ type: 'workspace-created', tenantId: 't1', challengeToken: 'pc-1' });
    store.dispatch({ type: 'creation-finished' });
    expect(handoverOf(store, true)).toEqual({ email: 'amara@northwind.example', organisation: 'Northwind Studio', challengeToken: 'pc-1', phone: null, continueToPlan: true });
    expect(handoverOf(store, false)).toMatchObject({ continueToPlan: false });
  });

  it('hands over the business phone given for a bought domain, to start the phone step from', () => {
    const store = createBusinessStore();
    store.dispatch({ type: 'domain-source-chosen', source: 'bought' });
    store.dispatch({ type: 'domain-picked', offer: { domain: 'example.com', yearly: { amount: 1, currency: 'NGN' }, bestMatch: true } });
    store.dispatch({ type: 'address-entered', address: { street: 's', street2: '', city: 'c', state: 'Lagos', localArea: '', postalCode: '', phoneCountry: 'NG', phone: '803 555 0142' } });
    store.dispatch({ type: 'workspace-created', tenantId: 't1', challengeToken: 'pc-1' });
    store.dispatch({ type: 'creation-finished' });
    expect(handoverOf(store, true)?.phone).toEqual({ country: 'NG', number: '803 555 0142' });
  });
});

describe('filling in from the account in use', () => {
  const profile: Profile = { id: '1', globalId: 'g', email: 'amara.okafor@yahel.example', firstName: 'Amara', lastName: 'Okafor', displayName: 'Amara Okafor', photo: null, accountType: 'personal' };
  const account = (kind: 'personal' | 'business'): ClientAccount => ({ handle: 'h-0', slot: 0, displayName: 'Amara Okafor', initials: 'AO', avatarUrl: null, email: 'amara.okafor@yahel.example', kind, organisation: kind === 'business' ? 'Northwind Studio' : null, role: null, signedIn: true });

  it('takes the name and address of a personal account in use', () => {
    expect(prefillOf({ profile, handle: 'h-0' }, [account('personal')])).toEqual({ firstName: 'Amara', lastName: 'Okafor', contactEmail: 'amara.okafor@yahel.example', from: 'amara.okafor@yahel.example' });
  });

  it('takes nothing from a business account, from nobody, or when the list cannot say which kind it is', () => {
    expect(prefillOf({ profile, handle: 'h-0' }, [account('business')])).toBeNull();
    expect(prefillOf({ profile: null, handle: null }, [account('personal')])).toBeNull();
    expect(prefillOf({ profile, handle: 'h-0' }, null)).toBeNull();
    expect(prefillOf({ profile, handle: 'h-other' }, [account('personal')])).toBeNull();
  });

  it('fills the flow once, the first time it is entered signed in as a personal account', async () => {
    const business = createBusinessStore();
    const accounts = vi.fn().mockResolvedValue([account('personal')]);
    const context = {
      session: { store: { getState: () => ({ status: 'signed-in', profile, slot: 0, handle: 'h-0' }) } } as unknown as Session,
      queryClient: new QueryClient(),
      capabilities: createAccountCapabilities({ auth: { accounts } } as never),
      business,
    };

    await prefillFromAccount(context);
    expect(business.getState()).toMatchObject({ firstName: 'Amara', prefilledFrom: 'amara.okafor@yahel.example' });

    business.dispatch({ type: 'you-entered', firstName: '', lastName: '', contactEmail: '' });
    await prefillFromAccount(context);
    expect(business.getState().firstName).toBe('');
  });
});
