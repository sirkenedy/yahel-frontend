// STAND-IN. Missing endpoint: POST /v1/tenants/domain-claims/check (the domain in the body): whether a
// domain a business says it owns can be claimed by a new workspace. Here a domain whose first label is
// "taken" is claimed, a handful of email providers' domains are public, and everything else is free.
// Nothing touches the network.
//
// The real endpoint tells anyone whether a domain already has a Yahel workspace, which
// POST /v1/auth/register-business reveals today (`DOMAIN_CONFLICT`). It must therefore say no more than
// that answer does (never who holds the domain or whether it is verified), be rate limited by caller
// strictly enough that walking a list of domains is impractical, and apply the backend's own list of
// public email domains, which the interface cannot know. It is advice: register-business remains the one
// place a domain is claimed, and its refusal is handled the same way.
import type { DomainClaims } from '../capabilities';
import { createLimiter } from './timing';
import type { Delay } from './timing';

const PUBLIC: readonly string[] = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'yahel.com'];

export const createDomainClaimsStandIn = (delay: Delay): DomainClaims => {
  const count = createLimiter(40);
  return {
    async check(domain) {
      await delay(450);
      count();
      const name = domain.trim().toLowerCase();
      if (PUBLIC.includes(name)) return 'public';
      return name.startsWith('taken.') ? 'claimed' : 'free';
    },
  };
};
