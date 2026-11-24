import { describe, expect, it } from 'vitest';
import { adminAddressOf, backOf, businessSteps, directionOf, domainOf, hasWorkspaceUnderway, initialBusinessState, nextOf, progressOf, reduce, resumeStep, seatsOf, stepOfPath, stepPath } from './machine';
import type { BusinessEvent, BusinessFacts, BusinessState, BusinessStep } from './machine';

const all: BusinessFacts = { domainsForSale: true, billing: true, signedIn: false };
const bare: BusinessFacts = { domainsForSale: false, billing: false, signedIn: false };
const signedIn: BusinessFacts = { ...all, signedIn: true };
const after = (...events: BusinessEvent[]): BusinessState => events.reduce(reduce, initialBusinessState);
const offer = { domain: 'example.com', yearly: { amount: 1_850_000, currency: 'NGN' }, bestMatch: true };
const address = { street: '12 Admiralty Way', street2: '', city: 'Lekki', state: 'Lagos', localArea: '', postalCode: '', phoneCountry: 'NG', phone: '803 555 0142' };
const payment = { id: 'pay_1', card: { brand: 'Visa', lastFour: '4081' }, sentTo: null };

const business: BusinessEvent = { type: 'business-entered', businessName: 'Northwind Studio', size: 'small', country: 'NG' };
const you: BusinessEvent = { type: 'you-entered', firstName: 'Amara', lastName: 'Okafor', contactEmail: 'amara@mail.example' };
const owned: BusinessEvent[] = [business, you, { type: 'owned-domain-entered', domain: 'northwind.example' }, { type: 'owned-domain-confirmed' }];
const bought: BusinessEvent[] = [business, you, { type: 'domain-source-chosen', source: 'bought' }, { type: 'domain-picked', offer }, { type: 'address-entered', address }];
const admin: BusinessEvent = { type: 'admin-entered', adminUser: 'amara', password: 'Northwind Lagos 2026!', marketing: { productNews: true, teamTips: false } };
const created: BusinessEvent[] = [{ type: 'creation-started' }, { type: 'workspace-created', tenantId: 't1', challengeToken: 'pc-1' }, { type: 'creation-finished' }];
const madeOwned: BusinessEvent[] = [...owned, admin, ...created];

describe('reduce', () => {
  it('records each answer, and asks no date of birth', () => {
    const state = after(...owned, admin);
    expect(state).toMatchObject({ businessName: 'Northwind Studio', size: 'small', country: 'NG', firstName: 'Amara', contactEmail: 'amara@mail.example', domainSource: 'owned', ownedDomain: 'northwind.example', ownedDomainConfirmed: true, adminUser: 'amara', password: 'Northwind Lagos 2026!', marketing: { productNews: true, teamTips: false } });
    expect(state).not.toHaveProperty('birth');
  });

  it('keeps the password already chosen when the administrator’s other answers are changed', () => {
    expect(after(...owned, admin, { type: 'admin-entered', adminUser: 'admin', password: null, marketing: { productNews: false, teamTips: false } })).toMatchObject({ adminUser: 'admin', password: 'Northwind Lagos 2026!' });
  });

  it('starts the first search with the business’s own name, and forgets what was picked when the search changes', () => {
    const searching = after(business, { type: 'domain-source-chosen', source: 'bought' });
    expect(searching.search).toBe('northwind studio');

    const picked = reduce(searching, { type: 'domain-picked', offer });
    expect(picked).toMatchObject({ domainSource: 'bought', bought: offer });
    expect(reduce(picked, { type: 'search-typed', query: 'northwind studio' })).toBe(picked);
    expect(reduce(picked, { type: 'search-typed', query: 'harbour' })).toMatchObject({ search: 'harbour', bought: null });
  });

  it('un-confirms a domain that is entered again or refused, and says which step has to be answered again', () => {
    const refused = after(...owned, { type: 'domain-refused', reason: 'claimed' });
    expect(refused).toMatchObject({ ownedDomainConfirmed: false, rejection: { step: 'domain', reason: 'claimed' } });
    expect(reduce(refused, { type: 'owned-domain-entered', domain: 'other.example' })).toMatchObject({ ownedDomain: 'other.example', ownedDomainConfirmed: false, rejection: null });
  });

  it('holds of a payment only what a receipt would print, and drops it when the order changes', () => {
    const paying = after(...madeOwned, { type: 'plan-chosen' }, { type: 'payment-started', payment });
    expect(paying.payment).toEqual({ ...payment, authorised: false });
    expect(reduce(paying, { type: 'payment-authorised' }).payment?.authorised).toBe(true);
    expect(reduce(initialBusinessState, { type: 'payment-authorised' })).toBe(initialBusinessState);

    const changes: BusinessEvent[] = [{ type: 'seats-chosen', seats: 4 }, { type: 'period-chosen', period: 'yearly' }, { type: 'promo-changed', promo: { code: 'LAUNCH', percent: 20, months: 3 } }, { type: 'payment-dropped' }];
    for (const change of changes) expect(reduce(paying, change).payment).toBeNull();
  });

  it('asks again for what was priced in the old currency when the country changes', () => {
    const priced = after(...bought, { type: 'promo-changed', promo: { code: 'LAUNCH', percent: 20, months: 3 } });
    expect(reduce(priced, { ...business, country: 'KE' } as BusinessEvent)).toMatchObject({ country: 'KE', promo: null, address: null });
  });

  it('drops the password the moment the workspace exists, and keeps the phone check registration answered with', () => {
    expect(after(...owned, admin, { type: 'creation-started' }, { type: 'workspace-created', tenantId: 't1', challengeToken: 'pc-1' })).toMatchObject({ password: null, challengeToken: 'pc-1', creation: { started: true, created: true, tenantId: 't1', finished: false, settled: false } });
    expect(after(...madeOwned, { type: 'order-settled' }).creation).toMatchObject({ finished: true, settled: true });
  });

  it('ends the attempt when an answer is rejected, keeping the password for another', () => {
    const rejected = after(...owned, admin, { type: 'creation-started' }, { type: 'answer-rejected', rejection: { step: 'domain', reason: 'claimed' } });
    expect(rejected).toMatchObject({ rejection: { step: 'domain', reason: 'claimed' }, ownedDomainConfirmed: false, creation: { started: false, created: false } });
    expect(rejected.password).toBe('Northwind Lagos 2026!');
    expect(reduce(after(...bought, admin), { type: 'answer-rejected', rejection: { step: 'find', reason: 'claimed' } })).toMatchObject({ bought: null });
    expect(reduce(after(...owned, { type: 'answer-rejected', rejection: { step: 'admin', reason: 'taken' } }), admin).rejection).toBeNull();
  });

  it('forgets everything on reset', () => {
    expect(after(...madeOwned, { type: 'reset' })).toBe(initialBusinessState);
  });
});

describe('what the answers add up to', () => {
  it('names the domain and the administrator’s address for either kind of domain', () => {
    expect(domainOf(after(...owned))).toBe('northwind.example');
    expect(domainOf(after(...bought))).toBe('example.com');
    expect(adminAddressOf(after(...bought, admin))).toBe('amara@example.com');
  });

  it('counts the people chosen at checkout, or the smallest team of the size given', () => {
    expect(seatsOf(after(business))).toBe(2);
    expect(seatsOf(after(business, { type: 'seats-chosen', seats: 7 }))).toBe(7);
  });
});

describe('resumeStep', () => {
  const every = (state: BusinessState, facts: BusinessFacts, expected: Partial<Record<BusinessStep, BusinessStep>>) => {
    for (const step of businessSteps) if (expected[step]) expect(`${step} → ${resumeStep(step, state, facts)}`).toBe(`${step} → ${expected[step]}`);
  };

  it('sends every step to the start when nothing has been answered', () => {
    for (const step of businessSteps) expect(resumeStep(step, initialBusinessState, all)).toBe('start');
  });

  it('shows the questions in order as each is answered, up to the admin sign-in', () => {
    every(after(business), all, { you: 'you', 'domain-question': 'you', admin: 'you', plan: 'you' });
    every(after(business, you), all, { 'domain-question': 'domain-question', domain: 'domain', find: 'find', found: 'find', registrant: 'find', admin: 'domain-question' });
    every(after(...owned), all, { admin: 'admin', creating: 'admin', ready: 'admin', plan: 'admin', checkout: 'admin', gateway: 'admin', paid: 'admin' });
  });

  it('shows the picked domain, then its registrant’s address, then the admin sign-in', () => {
    const picked = after(business, you, { type: 'domain-source-chosen', source: 'bought' }, { type: 'domain-picked', offer });
    every(picked, all, { found: 'found', registrant: 'registrant', admin: 'registrant' });
    every(after(...bought), all, { admin: 'admin' });
  });

  it('does not show the confirmation of a domain that was refused', () => {
    expect(resumeStep('domain-ok', after(...owned, { type: 'domain-refused', reason: 'public' }), all)).toBe('domain');
  });

  it('holds every step at creating while the workspace is being made', () => {
    const started = after(...owned, admin, { type: 'creation-started' });
    for (const step of businessSteps) expect(resumeStep(step, started, all)).toBe('creating');
    expect(resumeStep('admin', reduce(started, { type: 'creation-stopped' }), all)).toBe('admin');
  });

  it('once it exists and until the phone check signs in, shows only Ready', () => {
    for (const step of businessSteps) expect(resumeStep(step, after(...madeOwned), all)).toBe('ready');
  });

  it('once signed in, the plan, checkout, the payment page and the bank’s code in order, and only what was paid after', () => {
    every(after(...madeOwned), signedIn, { start: 'plan', admin: 'plan', ready: 'plan', plan: 'plan', checkout: 'plan', gateway: 'plan', 'card-code': 'plan', paid: 'plan' });
    const planned = after(...madeOwned, { type: 'plan-chosen' });
    every(planned, signedIn, { checkout: 'checkout', registrant: 'registrant', gateway: 'checkout' });
    const addressed = reduce(planned, { type: 'address-entered', address });
    every(addressed, signedIn, { gateway: 'gateway', 'card-code': 'gateway' });
    const paying = reduce(addressed, { type: 'payment-started', payment });
    every(paying, signedIn, { 'card-code': 'card-code' });
    const settled = after(...madeOwned, { type: 'plan-chosen' }, { type: 'order-settled' });
    for (const step of businessSteps) expect(resumeStep(step, settled, signedIn)).toBe('paid');
  });

  it('without billing, the signed-in administrator has nothing left here but Ready', () => {
    for (const step of businessSteps) expect(resumeStep(step, after(...madeOwned), { ...bare, signedIn: true })).toBe('ready');
    every(after(business, you), bare, { 'domain-question': 'domain', find: 'domain', domain: 'domain' });
  });
});

describe('nextOf and backOf', () => {
  it('follows the designed order for a domain the business owns', () => {
    const state = after(...owned, admin);
    expect((['start', 'you', 'domain-question', 'domain', 'domain-ok', 'admin'] as const).map((step) => nextOf(step, state, all))).toEqual(['you', 'domain-question', 'domain', 'domain-ok', 'admin', 'creating']);
    expect((['you', 'domain-question', 'domain', 'domain-ok', 'admin'] as const).map((step) => backOf(step, state, all))).toEqual(['start', 'you', 'domain-question', 'domain', 'domain-ok']);
  });

  it('goes through the search, the domain found and the registrant’s address for a domain bought here', () => {
    const state = after(...bought);
    expect(['domain-question', 'find', 'found', 'registrant'].map((step) => nextOf(step as 'find', state, all))).toEqual(['find', 'found', 'registrant', 'admin']);
    expect(['found', 'registrant', 'admin'].map((step) => backOf(step as 'found', state, all))).toEqual(['find', 'found', 'registrant']);
  });

  it('after the workspace: plan, checkout, the payment page; the address from checkout returns there', () => {
    const state = after(...madeOwned, { type: 'plan-chosen' });
    expect(nextOf('plan', state, signedIn)).toBe('checkout');
    expect(nextOf('checkout', state, signedIn)).toBe('gateway');
    expect(nextOf('registrant', state, signedIn)).toBe('checkout');
    expect(backOf('registrant', state, signedIn)).toBe('checkout');
    expect(['checkout', 'gateway', 'card-code'].map((step) => backOf(step as 'checkout', state, signedIn))).toEqual(['plan', 'checkout', 'gateway']);
  });

  it('has no way back from the first step, while it is made, from Ready, the plan, or once paid', () => {
    expect((['start', 'creating', 'ready', 'plan', 'paid'] as const).map((step) => backOf(step, initialBusinessState, all))).toEqual([null, null, null, null, null]);
  });

  it('without domains for sale, skips the question about the domain', () => {
    const state = after(...owned, admin);
    expect(nextOf('you', state, bare)).toBe('domain');
    expect(backOf('domain', state, bare)).toBe('you');
    expect(nextOf('admin', state, bare)).toBe('creating');
  });
});

describe('progress, addresses and direction', () => {
  it('counts six questions with billing and four without, and gives the screens between none', () => {
    expect(progressOf('start', all)).toEqual({ current: 1, total: 6, part: 'business' });
    expect((['domain-question', 'domain', 'domain-ok', 'find', 'found', 'registrant'] as const).map((step) => progressOf(step, all)?.current)).toEqual([3, 3, 3, 3, 3, 3]);
    expect(progressOf('card-code', all)).toEqual({ current: 6, total: 6, part: 'checkout' });
    expect(progressOf('admin', bare)).toEqual({ current: 4, total: 4, part: 'admin' });
    for (const step of ['creating', 'ready', 'gateway', 'paid'] as const) expect(progressOf(step, all)).toBeNull();
  });

  it('gives every step an address, and reads the step back from it', () => {
    for (const step of businessSteps) expect(stepOfPath(stepPath(step))).toBe(step);
    expect(stepOfPath('/business')).toBeNull();
  });

  it('knows which way a move goes', () => {
    expect(directionOf('start', 'you')).toBe('forward');
    expect(directionOf('checkout', 'plan')).toBe('back');
  });

  it('says a workspace is underway only once it exists', () => {
    expect(hasWorkspaceUnderway(after(...owned, admin, { type: 'creation-started' }))).toBe(false);
    expect(hasWorkspaceUnderway(after(...owned, admin, { type: 'workspace-created', tenantId: null, challengeToken: 'pc-1' }))).toBe(true);
  });
});

describe('filling in from the personal account in use', () => {
  const prefill = { type: 'prefilled', firstName: 'Amara', lastName: 'Okafor', contactEmail: 'amara.okafor@yahel.example', from: 'amara.okafor@yahel.example' } as const;

  it('fills the empty name and address fields and says where from', () => {
    expect(after(prefill)).toMatchObject({ firstName: 'Amara', lastName: 'Okafor', contactEmail: 'amara.okafor@yahel.example', prefilledFrom: 'amara.okafor@yahel.example' });
  });

  it('never overwrites what was typed, and never fills again, even a field cleared since', () => {
    const typed = after({ type: 'you-entered', firstName: 'Ama', lastName: '', contactEmail: '' }, prefill);
    expect(typed).toMatchObject({ firstName: 'Ama', lastName: 'Okafor', contactEmail: 'amara.okafor@yahel.example' });

    const cleared = reduce(reduce(after(prefill), { type: 'you-entered', firstName: '', lastName: '', contactEmail: '' }), { ...prefill, firstName: 'Other' });
    expect(cleared).toMatchObject({ firstName: '', lastName: '', contactEmail: '' });
  });

  it('touches nothing else: no administrator address', () => {
    expect({ ...after(prefill), firstName: '', lastName: '', contactEmail: '', prefilledFrom: null }).toEqual(initialBusinessState);
  });
});
