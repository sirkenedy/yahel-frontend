// STAND-IN. Missing endpoint: GET /v1/domains/search?q= (domains that can be registered now, each with
// its yearly price in the workspace's currency). Here four names are made from the words asked about,
// all of them "available", at the placeholder prices drawn on the design boards (.com ₦18,500, .ng
// ₦9,000, .africa ₦22,000 a year). THE PRICES ARE PLACEHOLDERS for the business to confirm. Nothing
// touches the network, and a search that is cancelled stops.
//
// The real endpoint asks a registrar, so it must: list only names it has just checked can be registered;
// price them itself (the interface never computes a price); be rate limited by caller; and hold nothing
// for the asker. A name is only registered, and paid for, with the workspace order (see
// `workspace-billing.ts`), where the registry's own answer decides, and the registrant's contact details
// are taken with privacy protection on.
import type { DomainMarket, DomainOffer } from '../capabilities';
import { createLimiter } from './timing';
import type { Delay } from './timing';

const YEARLY: Record<string, number> = { '.com': 18_500_00, '.ng': 9_000_00, '.africa': 22_000_00 };

const offer = (domain: string, bestMatch: boolean): DomainOffer => ({ domain, yearly: { amount: YEARLY[domain.slice(domain.lastIndexOf('.'))] ?? 0, currency: 'NGN' }, bestMatch });

export const createDomainMarketStandIn = (delay: Delay): DomainMarket => {
  const count = createLimiter(60);
  return {
    async search(query, signal) {
      await delay(350);
      signal?.throwIfAborted();
      count();
      const name = query.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (name.length < 2) return [];
      return [`${name}.com`, `${name}.ng`, `${name}.africa`, `${name}hq.com`].map((domain, index) => offer(domain, index === 0));
    },
  };
};
