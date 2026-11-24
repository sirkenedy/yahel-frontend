import { describe, expect, it } from 'vitest';
import { createStandIns } from './index';
import { quoteFor } from './workspace-billing';

const instant = async () => undefined;

describe('stand-ins', () => {
  it('text codes: names a masked number, then refuses the fourth request', async () => {
    const { textCodes } = createStandIns(instant);

    for (let attempt = 0; attempt < 3; attempt += 1) await expect(textCodes.send('challenge')).resolves.toEqual({ destination: '+234 ••• ••• ••42' });
    await expect(textCodes.send('challenge')).rejects.toMatchObject({ status: 429 });
  });

  it('recovery by phone: offers every address the same masked number', async () => {
    const { recoveryByPhone } = createStandIns(instant);

    const known = await recoveryByPhone.options('amara@northwind.example');
    const unknown = await recoveryByPhone.options('nobody@nowhere.example');
    expect(known).toEqual([{ method: 'phone', destination: '+234 ••• ••• ••42' }]);
    expect(unknown).toEqual(known);

    for (let attempt = 0; attempt < 3; attempt += 1) await recoveryByPhone.send('amara@northwind.example', 'phone');
    await expect(recoveryByPhone.send('amara@northwind.example', 'phone')).rejects.toMatchObject({ status: 429 });
  });

  it('help desk: accepts a request, then refuses the fourth', async () => {
    const { helpDesk } = createStandIns(instant);

    for (let attempt = 0; attempt < 3; attempt += 1) await expect(helpDesk.request({ contact: 'amara@northwind.example' })).resolves.toBeUndefined();
    await expect(helpDesk.request({ contact: 'amara@northwind.example' })).rejects.toMatchObject({ status: 429 });
  });

  it('keeps separate state per set, so one page session cannot exhaust another', async () => {
    const first = createStandIns(instant);
    for (let attempt = 0; attempt < 3; attempt += 1) await first.helpDesk.request({ contact: 'a@b.example' });

    await expect(createStandIns(instant).helpDesk.request({ contact: 'a@b.example' })).resolves.toBeUndefined();
  });

  it('preferences: keeps the choices it was given', async () => {
    const { preferences } = createStandIns(instant);

    await expect(preferences.save({ productNews: true, activityHistory: false })).resolves.toBeUndefined();
  });

  it('service status: announces a two-hour window that is under way', async () => {
    const { createServiceStatusStandIn } = await import('./service-status');
    const now = Date.parse('2026-11-22T01:40:00.000Z');

    await expect(createServiceStatusStandIn(instant, () => now).window()).resolves.toEqual({ from: '2026-11-22T00:00:00.000Z', until: '2026-11-22T02:00:00.000Z' });
  });
});

describe('stand-ins for a new workspace', () => {
  const order = { planId: 'business', period: 'monthly' as const, seats: 3, promoCode: null, domain: null };
  const card = { number: '4084 0840 8408 4081', expiry: '08/29', securityCode: '123', name: 'Amara Okafor', billingAddress: null };
  const contact = { businessName: 'Northwind Studio', email: 'amara@mail.example', address: null };
  const now = Date.UTC(2026, 10, 21);
  const naira = (amount: number) => ({ amount: amount * 100, currency: 'NGN' });

  it('domain market: offers four names made from the words asked about, the first marked best, at the boards’ prices', async () => {
    const { domainMarket } = createStandIns(instant);

    await expect(domainMarket.search('Example')).resolves.toEqual([
      { domain: 'example.com', yearly: naira(18_500), bestMatch: true },
      { domain: 'example.ng', yearly: naira(9_000), bestMatch: false },
      { domain: 'example.africa', yearly: naira(22_000), bestMatch: false },
      { domain: 'examplehq.com', yearly: naira(18_500), bestMatch: false },
    ]);
  });

  it('domain market: finds nothing for words with no usable letters, and stops a search that was cancelled', async () => {
    const { domainMarket } = createStandIns(instant);
    await expect(domainMarket.search('!')).resolves.toEqual([]);

    const cancelled = new AbortController();
    cancelled.abort();
    await expect(domainMarket.search('northwind', cancelled.signal)).rejects.toBeDefined();
  });

  it('billing: sells one plan, with the prices and the trial the boards show', async () => {
    const { workspaceBilling } = createStandIns(instant);

    await expect(workspaceBilling.plan('NG')).resolves.toMatchObject({ id: 'business', name: 'Yahel Business', seatPrice: { monthly: naira(5000), yearly: naira(4200) }, yearlySaving: 16, trial: { days: 14, maxSeats: 10 }, taxRate: 7.5, enterpriseFrom: 300 });
  });

  it('billing: knows one promo code, in any case', async () => {
    const { workspaceBilling } = createStandIns(instant);

    await expect(workspaceBilling.promo(' launch ')).resolves.toEqual({ code: 'LAUNCH', percent: 20, months: 3 });
    await expect(workspaceBilling.promo('FREE')).resolves.toBeNull();
  });

  it('quote: a small team starts a free trial and pays nothing today', () => {
    expect(quoteFor(order, now)).toMatchObject({
      trial: true,
      seatPrice: naira(5000),
      discountedSeatPrice: null,
      dueToday: naira(0),
      planToday: naira(15_000),
      domain: null,
      schedule: [
        { from: null, kind: 'trial', amount: naira(0) },
        { from: '2026-12-05', kind: 'plan', amount: naira(15_000), per: 'month', billedYearly: null },
      ],
    });
  });

  it('quote: a domain bought here is due today even during the trial', () => {
    expect(quoteFor({ ...order, domain: 'example.com' }, now)).toMatchObject({ trial: true, domain: { name: 'example.com', yearly: naira(18_500) }, dueToday: naira(18_500) });
  });

  it('quote: a yearly trial says what the year will cost', () => {
    expect(quoteFor({ ...order, period: 'yearly' }, now).schedule[1]).toMatchObject({ from: '2026-12-05', kind: 'plan', amount: naira(12_600), per: 'month', billedYearly: naira(151_200) });
  });

  it('quote: a promo code gives the months at a reduced price after the trial, then the plan', () => {
    expect(quoteFor({ ...order, promoCode: 'LAUNCH' }, now)).toMatchObject({
      promo: { code: 'LAUNCH', percent: 20, months: 3 },
      seatPrice: naira(5000),
      discountedSeatPrice: naira(4000),
      schedule: [
        { kind: 'trial' },
        { from: '2026-12-05', kind: 'discount', amount: naira(12_000), per: 'month', discount: { percent: 20, months: 3 } },
        { from: '2027-03-05', kind: 'plan', amount: naira(15_000), per: 'month' },
      ],
    });
  });

  it('quote: a team of more than ten has no trial and pays the first period today', () => {
    expect(quoteFor({ ...order, seats: 12 }, now)).toMatchObject({
      trial: false,
      dueToday: naira(60_000),
      schedule: [
        { from: null, kind: 'first-period', amount: naira(60_000), per: 'month' },
        { from: '2026-12-21', kind: 'plan', amount: naira(60_000), per: 'month' },
      ],
    });
    expect(quoteFor({ ...order, seats: 12, period: 'yearly' }, now)).toMatchObject({
      dueToday: naira(604_800),
      schedule: [
        { from: null, kind: 'first-period', amount: naira(604_800), per: 'year' },
        { from: '2027-11-21', kind: 'renewal', amount: naira(604_800), per: 'year' },
      ],
    });
    expect(quoteFor({ ...order, seats: 12, promoCode: 'LAUNCH' }, now).schedule).toMatchObject([
      { from: null, kind: 'first-period', amount: naira(48_000), discount: { percent: 20, months: 1 } },
      { from: '2026-12-21', kind: 'discount', amount: naira(48_000), discount: { percent: 20, months: 2 } },
      { from: '2027-02-21', kind: 'plan', amount: naira(60_000) },
    ]);
  });

  it('quote: never counts fewer than one person', () => {
    expect(quoteFor({ ...order, seats: 0 }, now)).toMatchObject({ seats: 1, planToday: naira(5000) });
  });

  it('paying: asks for the bank’s code, accepts a right one, and completing is safe to repeat', async () => {
    const { workspaceBilling } = createStandIns(instant);
    const started = await workspaceBilling.pay(order, card, { ...contact, address: { street: '12 Admiralty Way', street2: '', city: 'Lekki', state: 'Lagos', localArea: '', postalCode: '', country: 'NG', phone: '+2348035550142' } });
    expect(started).toEqual({ status: 'code-needed', paymentId: expect.stringMatching(/^pay_demo_/) as string, sentTo: '••• ••• ••42' });
    if (started.status !== 'code-needed') return;

    await expect(workspaceBilling.confirm(started.paymentId, '482913')).resolves.toBe('authorised');
    const done = { tenantId: 't1', domain: 'northwind.example', marketing: { productNews: false, teamTips: false } };
    await expect(workspaceBilling.complete(started.paymentId, done)).resolves.toBeUndefined();
    await expect(workspaceBilling.complete(started.paymentId, done)).resolves.toBeUndefined();
  });

  it('paying: names no number when it knows none, and nothing it answers carries the card', async () => {
    const { workspaceBilling } = createStandIns(instant);
    const started = await workspaceBilling.pay(order, card, contact);

    expect(started).toMatchObject({ status: 'code-needed', sentTo: null });
    for (const detail of ['4084', '08/29', '123', 'Amara']) expect(JSON.stringify(started)).not.toContain(detail);
  });

  it('paying: one card is declined, and no payment is opened for it', async () => {
    const { workspaceBilling } = createStandIns(instant);

    await expect(workspaceBilling.pay(order, { ...card, number: '4000 0000 0000 0002' }, contact)).resolves.toEqual({ status: 'declined' });
  });

  it('the bank’s code: wrong, expired, then spent after five wrong tries until a new code is sent', async () => {
    const { workspaceBilling } = createStandIns(instant);
    const started = await workspaceBilling.pay(order, card, contact);
    if (started.status !== 'code-needed') throw new Error('expected a code');
    const { paymentId } = started;

    await expect(workspaceBilling.confirm(paymentId, '999999')).resolves.toBe('expired-code');
    for (let tries = 0; tries < 4; tries += 1) await expect(workspaceBilling.confirm(paymentId, '000000')).resolves.toBe('wrong-code');
    await expect(workspaceBilling.confirm(paymentId, '000000')).resolves.toBe('spent');
    await expect(workspaceBilling.confirm(paymentId, '482913')).resolves.toBe('spent');

    await workspaceBilling.resendCode(paymentId);
    await expect(workspaceBilling.confirm(paymentId, '482913')).resolves.toBe('authorised');
  });

  it('a payment that was not authorised cannot be completed, a released one is spent, and an unknown one is refused', async () => {
    const { workspaceBilling } = createStandIns(instant);
    const started = await workspaceBilling.pay(order, card, contact);
    if (started.status !== 'code-needed') throw new Error('expected a code');
    const done = { tenantId: null, domain: 'northwind.example', marketing: { productNews: false, teamTips: false } };

    await expect(workspaceBilling.complete(started.paymentId, done)).rejects.toMatchObject({ status: 409 });
    await workspaceBilling.release(started.paymentId);
    await workspaceBilling.release(started.paymentId);
    await expect(workspaceBilling.confirm(started.paymentId, '482913')).resolves.toBe('spent');
    await expect(workspaceBilling.confirm('pay_unknown', '482913')).rejects.toMatchObject({ status: 404 });
    await expect(workspaceBilling.release('pay_unknown')).resolves.toBeUndefined();
  });
});
