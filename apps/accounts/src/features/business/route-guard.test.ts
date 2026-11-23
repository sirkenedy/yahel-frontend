import { createAccountCapabilities } from '@yahel/api-client';
import { createStandIns } from '@yahel/api-client/standins';
import type { Session } from '@yahel/auth';
import { describe, expect, it } from 'vitest';
import { arriveAtCheckout, businessFacts, forgetWorkspace, handoverOf, isOffered, isSignedIn, stepInsteadOf } from './route-guard';
import { createBusinessStore } from './store';

const api = { auth: {} } as never;
const sessionIn = (status: 'signed-in' | 'signed-out') => ({ session: { store: { getState: () => ({ status, profile: null }) } } as unknown as Session });

describe('businessFacts', () => {
  it('offers the whole designed flow where something answers for plans and domains', () => {
    expect(businessFacts({ capabilities: createAccountCapabilities(api, createStandIns()) })).toEqual({ domainsForSale: true, billing: true });
  });

  it('offers neither a domain to buy nor a checkout where nothing does', () => {
    expect(businessFacts({ capabilities: createAccountCapabilities(api) })).toEqual({ domainsForSale: false, billing: false });
  });

  it('does not sell a domain where there is nowhere to pay for it', () => {
    const capabilities = { ...createAccountCapabilities(api, createStandIns()), workspaceBilling: null };
    expect(businessFacts({ capabilities })).toEqual({ domainsForSale: false, billing: false });
  });
});

describe('the guards', () => {
  it('lets the flow be shown only where this build offers it', () => {
    expect(isOffered({ config: { businessSignUp: true } })).toBe(true);
    expect(isOffered({ config: { businessSignUp: false } })).toBe(false);
  });

  it('knows when someone is already signed in', () => {
    expect(isSignedIn(sessionIn('signed-in'))).toBe(true);
    expect(isSignedIn(sessionIn('signed-out'))).toBe(false);
  });

  it('says which step to show instead, or nothing when the step can be shown', () => {
    const store = createBusinessStore();
    const facts = { domainsForSale: true, billing: true };
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
    store.dispatch({ type: 'workspace-created', tenantId: 't1' });
    forgetWorkspace(store, { unlessUnderway: true });
    expect(store.getState().businessName).toBe('Northwind Studio');
    forgetWorkspace(store);
    expect(store.getState().businessName).toBe('');
  });

  it('ends a change made from checkout on arriving there', () => {
    const store = createBusinessStore();
    store.dispatch({ type: 'edit-started' });
    arriveAtCheckout(store);
    expect(store.getState().editing).toBe(false);
    const before = store.getState();
    arriveAtCheckout(store);
    expect(store.getState()).toBe(before);
  });

  it('hands the new administrator’s address and the business’s name, never the password, to Admin’s first sign-in once the workspace is made', () => {
    const store = createBusinessStore();
    store.dispatch({ type: 'business-entered', businessName: 'Northwind Studio', size: 'small', country: 'NG' });
    store.dispatch({ type: 'owned-domain-entered', domain: 'northwind.example' });
    store.dispatch({ type: 'admin-entered', adminUser: 'amara', password: 'Northwind Lagos 2026!', marketing: { productNews: false, teamTips: false } });
    expect(handoverOf(store)).toBeNull();

    store.dispatch({ type: 'workspace-created', tenantId: 't1' });
    store.dispatch({ type: 'creation-finished' });
    expect(handoverOf(store)).toEqual({ email: 'amara@northwind.example', organisation: 'Northwind Studio' });
  });
});
