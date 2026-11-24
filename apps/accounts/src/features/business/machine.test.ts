import { describe, expect, it } from 'vitest';
import { adminAddressOf, backOf, businessSteps, directionOf, domainOf, hasWorkspaceUnderway, initialBusinessState, nextOf, progressOf, reduce, resumeStep, seatsOf, stepOfPath, stepPath } from './machine';
import type { BusinessEvent, BusinessFacts, BusinessState, BusinessStep } from './machine';

const all: BusinessFacts = { domainsForSale: true, billing: true };
const bare: BusinessFacts = { domainsForSale: false, billing: false };
const after = (...events: BusinessEvent[]): BusinessState => events.reduce(reduce, initialBusinessState);
const offer = { domain: 'example.com', yearly: { amount: 1_850_000, currency: 'NGN' }, bestMatch: true };
const address = { street: '12 Admiralty Way', street2: '', city: 'Lekki', state: 'Lagos', localArea: '', postalCode: '', phoneCountry: 'NG', phone: '803 555 0142' };
const payment = { id: 'pay_1', card: { brand: 'Visa', lastFour: '4081' }, sentTo: null };

const business: BusinessEvent = { type: 'business-entered', businessName: 'Northwind Studio', size: 'small', country: 'NG' };
const you: BusinessEvent = { type: 'you-entered', firstName: 'Amara', lastName: 'Okafor', contactEmail: 'amara@mail.example', birth: { day: 14, month: 3, year: 1994 } };
const owned: BusinessEvent[] = [business, you, { type: 'owned-domain-entered', domain: 'northwind.example' }, { type: 'owned-domain-confirmed' }];
const bought: BusinessEvent[] = [business, you, { type: 'domain-source-chosen', source: 'bought' }, { type: 'domain-picked', offer }, { type: 'address-entered', address }];
const admin: BusinessEvent = { type: 'admin-entered', adminUser: 'amara', password: 'Northwind Lagos 2026!', marketing: { productNews: true, teamTips: false } };
const toCheckout: BusinessEvent[] = [...owned, admin, { type: 'plan-chosen' }];

describe('reduce', () => {
  it('records each answer', () => {
    expect(after(...owned, admin)).toMatchObject({ businessName: 'Northwind Studio', size: 'small', country: 'NG', firstName: 'Amara', contactEmail: 'amara@mail.example', birth: { year: 1994 }, domainSource: 'owned', ownedDomain: 'northwind.example', ownedDomainConfirmed: true, adminUser: 'amara', password: 'Northwind Lagos 2026!', marketing: { productNews: true, teamTips: false } });
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
    expect(reduce(reduce(picked, { type: 'search-typed', query: 'harbour' }), { type: 'domain-source-chosen', source: 'bought' }).search).toBe('harbour');
  });

  it('un-confirms a domain that is entered again or refused, and says which step has to be answered again', () => {
    const refused = after(...owned, { type: 'domain-refused', reason: 'claimed' });
    expect(refused).toMatchObject({ ownedDomainConfirmed: false, rejection: { step: 'domain', reason: 'claimed' } });
    expect(reduce(refused, { type: 'owned-domain-entered', domain: 'other.example' })).toMatchObject({ ownedDomain: 'other.example', ownedDomainConfirmed: false, rejection: null });
  });

  it('holds of a payment only what a receipt would print, and drops it when the order changes', () => {
    const paying = after(...toCheckout, { type: 'payment-started', payment });
    expect(paying.payment).toEqual({ ...payment, authorised: false });
    expect(reduce(paying, { type: 'payment-authorised' }).payment?.authorised).toBe(true);
    expect(reduce(initialBusinessState, { type: 'payment-authorised' })).toBe(initialBusinessState);

    const changes: BusinessEvent[] = [{ type: 'seats-chosen', seats: 4 }, { type: 'period-chosen', period: 'yearly' }, { type: 'promo-changed', promo: { code: 'LAUNCH', percent: 20, months: 3 } }, { type: 'domain-picked', offer }, { type: 'owned-domain-entered', domain: 'x.example' }, { type: 'domain-source-chosen', source: 'bought' }, { type: 'search-typed', query: 'x' }, business, { type: 'payment-dropped' }];
    for (const change of changes) expect(reduce(paying, change).payment).toBeNull();
  });

  it('asks again for what was priced in the old currency when the country changes', () => {
    const priced = after(...bought, { type: 'promo-changed', promo: { code: 'LAUNCH', percent: 20, months: 3 } });
    expect(reduce(priced, { ...business, country: 'KE' } as BusinessEvent)).toMatchObject({ country: 'KE', promo: null, address: null });
    expect(reduce(priced, business)).toMatchObject({ promo: { code: 'LAUNCH' }, address });
  });

  it('drops the password the moment the workspace exists, and records each part of creating it', () => {
    const created = after(...toCheckout, { type: 'creation-started' }, { type: 'workspace-created', tenantId: 't1' });
    expect(created).toMatchObject({ password: null, creation: { started: true, created: true, tenantId: 't1', settled: false, finished: false } });
    expect(after(...toCheckout, { type: 'workspace-created', tenantId: null }, { type: 'order-settled' }, { type: 'creation-finished' }).creation).toMatchObject({ created: true, tenantId: null, settled: true, finished: true });
  });

  it('ends the attempt and its payment when an answer is rejected, and says where the person returns afterwards', () => {
    const paid = after(...toCheckout, { type: 'payment-started', payment }, { type: 'payment-authorised' }, { type: 'creation-started' });
    const rejected = reduce(paid, { type: 'answer-rejected', rejection: { step: 'domain', reason: 'claimed' }, returnToCheckout: true });
    expect(rejected).toMatchObject({ rejection: { step: 'domain', reason: 'claimed' }, editing: true, payment: null, ownedDomainConfirmed: false, creation: { started: false, created: false } });
    expect(rejected.password).toBe('Northwind Lagos 2026!');

    expect(reduce(after(...bought, admin), { type: 'answer-rejected', rejection: { step: 'find', reason: 'claimed' }, returnToCheckout: false })).toMatchObject({ bought: null, editing: false });
    expect(reduce(rejected, { type: 'admin-entered', adminUser: 'a', password: null, marketing: paid.marketing }).rejection).toEqual({ step: 'domain', reason: 'claimed' });
    expect(reduce(after(...toCheckout, { type: 'answer-rejected', rejection: { step: 'admin', reason: 'taken' }, returnToCheckout: true }), admin).rejection).toBeNull();
    expect(reduce(after(...toCheckout, { type: 'answer-rejected', rejection: { step: 'you', reason: 'underage' }, returnToCheckout: true }), you).rejection).toBeNull();
  });

  it('marks and ends a change made from checkout, and forgets everything on reset', () => {
    expect(after({ type: 'edit-started' }).editing).toBe(true);
    expect(after({ type: 'edit-started' }, { type: 'edit-finished' }).editing).toBe(false);
    expect(after(...toCheckout, { type: 'reset' })).toBe(initialBusinessState);
  });
});

describe('what the answers add up to', () => {
  it('names the domain and the administrator’s address for either kind of domain', () => {
    expect(domainOf(after(...owned))).toBe('northwind.example');
    expect(domainOf(after(...bought))).toBe('example.com');
    expect(domainOf(after(business, { type: 'domain-source-chosen', source: 'bought' }))).toBe('');
    expect(adminAddressOf(after(...bought, admin))).toBe('amara@example.com');
  });

  it('counts the people chosen at checkout, or the smallest team of the size given', () => {
    expect(seatsOf(after(business))).toBe(2);
    expect(seatsOf(initialBusinessState)).toBe(10);
    expect(seatsOf(after({ ...business, size: 'huge' } as BusinessEvent))).toBe(300);
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

  it('shows the questions in order as each is answered', () => {
    every(after(business), all, { you: 'you', 'domain-question': 'you', domain: 'you', find: 'you', admin: 'you', checkout: 'you' });
    every(after(business, you), all, { 'domain-question': 'domain-question', domain: 'domain', find: 'find', 'domain-ok': 'domain', registrant: 'domain-question', admin: 'domain-question', plan: 'domain-question' });
    every(after(business, you, { type: 'owned-domain-entered', domain: 'northwind.example' }), all, { 'domain-ok': 'domain-ok', admin: 'domain-ok' });
    every(after(...owned), all, { admin: 'admin', plan: 'admin', checkout: 'admin', registrant: 'admin', 'card-code': 'admin', creating: 'admin', ready: 'admin' });
    every(after(...owned, admin), all, { plan: 'plan', checkout: 'plan', 'card-code': 'plan' });
    every(after(...toCheckout), all, { checkout: 'checkout', registrant: 'registrant', 'card-code': 'checkout', creating: 'checkout', ready: 'checkout' });
  });

  it('asks for the registrant’s address once a domain has been picked, and for the admin sign-in only after it', () => {
    const picked = after(business, you, { type: 'domain-source-chosen', source: 'bought' }, { type: 'domain-picked', offer });
    every(picked, all, { registrant: 'registrant', admin: 'registrant' });
    every(after(business, you, { type: 'domain-source-chosen', source: 'bought' }), all, { registrant: 'find', admin: 'find' });
    every(after(...bought), all, { admin: 'admin' });
  });

  it('does not show the confirmation of a domain that was refused', () => {
    expect(resumeStep('domain-ok', after(...owned, { type: 'domain-refused', reason: 'public' }), all)).toBe('domain');
  });

  it('shows the bank’s code only while a payment waits for one', () => {
    const paying = after(...toCheckout, { type: 'payment-started', payment });
    expect(resumeStep('card-code', paying, all)).toBe('card-code');
    expect(resumeStep('card-code', reduce(paying, { type: 'payment-authorised' }), all)).toBe('checkout');
    expect(resumeStep('card-code', reduce(paying, { type: 'payment-dropped' }), all)).toBe('checkout');
  });

  it('shows creating once it has started, and only what comes after once the workspace exists', () => {
    const started = after(...toCheckout, { type: 'creation-started' });
    expect(resumeStep('creating', started, all)).toBe('creating');
    expect(resumeStep('ready', started, all)).toBe('creating');
    // While it is being made, Back or Forward cannot reach a checkout whose payment is in use.
    for (const step of businessSteps) expect(resumeStep(step, started, all)).toBe('creating');
    const stopped = reduce(started, { type: 'creation-stopped' });
    expect(stopped.creation.started).toBe(false);
    expect(resumeStep('checkout', stopped, all)).toBe('checkout');

    const created = reduce(started, { type: 'workspace-created', tenantId: 't1' });
    for (const step of businessSteps) expect(resumeStep(step, created, all)).toBe('creating');
    expect(reduce(created, { type: 'creation-stopped' })).toBe(created);
    const finished = reduce(created, { type: 'creation-finished' });
    for (const step of businessSteps) expect(resumeStep(step, finished, all)).toBe('ready');
  });

  it('without domains for sale or billing, goes from the person to the domain and from the admin sign-in to creating', () => {
    every(after(business, you), bare, { 'domain-question': 'domain', find: 'domain', domain: 'domain' });
    every(after(...owned, admin), bare, { plan: 'admin', checkout: 'admin', registrant: 'admin', creating: 'admin' });
    expect(resumeStep('creating', after(...owned, admin, { type: 'creation-started' }), bare)).toBe('creating');
  });
});

describe('nextOf and backOf', () => {
  it('follows the designed order for a domain the business owns', () => {
    const state = after(...owned, admin);
    expect((['start', 'you', 'domain-question', 'domain', 'domain-ok', 'admin', 'plan'] as const).map((step) => nextOf(step, state, all))).toEqual(['you', 'domain-question', 'domain', 'domain-ok', 'admin', 'plan', 'checkout']);
    expect((['you', 'domain-question', 'domain', 'domain-ok', 'admin', 'plan', 'checkout', 'card-code'] as const).map((step) => backOf(step, state, all))).toEqual(['start', 'you', 'domain-question', 'domain', 'domain-ok', 'admin', 'plan', 'checkout']);
  });

  it('goes through the search and the registrant’s address for a domain bought here', () => {
    const state = after(...bought);
    expect(nextOf('domain-question', state, all)).toBe('find');
    expect(nextOf('find', state, all)).toBe('registrant');
    expect(nextOf('registrant', state, all)).toBe('admin');
    expect(backOf('registrant', state, all)).toBe('find');
    expect(backOf('find', state, all)).toBe('domain-question');
    expect(backOf('admin', state, all)).toBe('registrant');
  });

  it('returns to checkout after an answer changed from there, but finishes a change of domain first', () => {
    const editing = after(...toCheckout, { type: 'edit-started' });
    expect((['start', 'you', 'domain-ok', 'registrant', 'admin', 'plan'] as const).map((step) => nextOf(step, editing, all))).toEqual(['checkout', 'checkout', 'checkout', 'checkout', 'checkout', 'checkout']);
    expect(nextOf('domain-question', editing, all)).toBe('domain');
    expect(nextOf('domain', editing, all)).toBe('domain-ok');
    expect((['start', 'you', 'domain-question', 'admin', 'plan'] as const).map((step) => backOf(step, editing, all))).toEqual(['checkout', 'checkout', 'checkout', 'checkout', 'checkout']);
    expect(backOf('domain', editing, all)).toBe('domain-question');
    expect(backOf('registrant', editing, all)).toBe('checkout');
  });

  it('has no way back from the first step, or once the workspace is being made', () => {
    expect((['start', 'creating', 'ready'] as const).map((step) => backOf(step, initialBusinessState, all))).toEqual([null, null, null]);
  });

  it('without domains for sale or billing, skips the question about the domain and creates after the admin sign-in', () => {
    const state = after(...owned, admin);
    expect(nextOf('you', state, bare)).toBe('domain');
    expect(backOf('domain', state, bare)).toBe('you');
    expect(nextOf('admin', state, bare)).toBe('creating');
    expect(nextOf('start', reduce(state, { type: 'edit-started' }), bare)).toBe('you');
  });
});

describe('progress, addresses and direction', () => {
  it('counts six questions with billing and four without, and gives the last screens no count', () => {
    expect(progressOf('start', all)).toEqual({ current: 1, total: 6, part: 'business' });
    expect((['domain-question', 'domain', 'domain-ok', 'find', 'registrant'] as const).map((step) => progressOf(step, all)?.current)).toEqual([3, 3, 3, 3, 3]);
    expect(progressOf('card-code', all)).toEqual({ current: 6, total: 6, part: 'checkout' });
    expect(progressOf('admin', bare)).toEqual({ current: 4, total: 4, part: 'admin' });
    expect(progressOf('you', all)?.part).toBe('you');
    expect(progressOf('plan', all)?.part).toBe('plan');
    expect(progressOf('checkout', all)?.current).toBe(6);
    expect(progressOf('creating', all)).toBeNull();
    expect(progressOf('ready', all)).toBeNull();
  });

  it('gives every step an address, and reads the step back from it', () => {
    for (const step of businessSteps) expect(stepOfPath(stepPath(step))).toBe(step);
    expect(stepOfPath('/business/card-code/')).toBe('card-code');
    expect(stepOfPath('/business')).toBeNull();
    expect(stepOfPath('/personal/name')).toBeNull();
  });

  it('knows which way a move goes', () => {
    expect(directionOf('start', 'you')).toBe('forward');
    expect(directionOf('checkout', 'plan')).toBe('back');
  });

  it('says a workspace is underway only once it exists', () => {
    expect(hasWorkspaceUnderway(after(...toCheckout, { type: 'creation-started' }))).toBe(false);
    expect(hasWorkspaceUnderway(after(...toCheckout, { type: 'workspace-created', tenantId: null }))).toBe(true);
  });
});

describe('filling in from the personal account in use', () => {
  const prefill = { type: 'prefilled', firstName: 'Amara', lastName: 'Okafor', contactEmail: 'amara.okafor@yahel.example', from: 'amara.okafor@yahel.example' } as const;

  it('fills the empty name and address fields and says where from', () => {
    expect(after(prefill)).toMatchObject({ firstName: 'Amara', lastName: 'Okafor', contactEmail: 'amara.okafor@yahel.example', prefilledFrom: 'amara.okafor@yahel.example' });
  });

  it('never overwrites what was typed, and never fills again, even a field cleared since', () => {
    const typed = after({ type: 'you-entered', firstName: 'Ama', lastName: '', contactEmail: '', birth: { day: 14, month: 3, year: 1994 } }, prefill);
    expect(typed).toMatchObject({ firstName: 'Ama', lastName: 'Okafor', contactEmail: 'amara.okafor@yahel.example' });

    const cleared = reduce(reduce(after(prefill), { type: 'you-entered', firstName: '', lastName: '', contactEmail: '', birth: { day: 14, month: 3, year: 1994 } }), { ...prefill, firstName: 'Other' });
    expect(cleared).toMatchObject({ firstName: '', lastName: '', contactEmail: '' });
  });

  it('touches nothing else: no date of birth, no administrator address', () => {
    const filled = after(prefill);
    expect(filled.birth).toBeNull();
    expect({ ...filled, firstName: '', lastName: '', contactEmail: '', prefilledFrom: null }).toEqual(initialBusinessState);
  });
});
