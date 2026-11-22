// STAND-IN. Missing endpoint: POST /v1/auth/address-availability (whether a Yahel address can still be
// had, and free ones like it). A handful of names are taken; every other well-formed name is free.
// Alternatives are made from the name asked about. The 41st check in a page session is refused as rate
// limited. Nothing touches the network, and a check that is cancelled stops.
//
// The real endpoint is a way to list who has an account, so it must: answer only `available` true or
// false, with no reason (taken, reserved, blocked and retired names all read the same); take the same
// time either way; be rate limited by caller and by device, strictly enough that walking a list of names
// is impractical; take the name in the request body, never the address bar; and offer alternatives it
// has itself checked. It is advice only: POST /v1/auth/register remains the one place a name is claimed.
import type { AddressAvailability } from '../capabilities';
import { createLimiter } from './timing';
import type { Delay } from './timing';

const TAKEN: readonly string[] = ['amara', 'admin', 'hello', 'info', 'okafor', 'amara.o', 'support'];

const alternativesTo = (name: string) => {
  const [first = name, ...rest] = name.split('.');
  const last = rest.join('');
  const candidates = last ? [`${last}.${first}`, `${first}${last}`, `${first}.${last}1`, `${first}.${last.charAt(0)}`] : [`${first}.mail`, `${first}1`, `hello.${first}`];
  return candidates.filter((candidate) => candidate.length >= 4 && !TAKEN.includes(candidate)).slice(0, 3);
};

export const createAddressStandIn = (delay: Delay): AddressAvailability => {
  const count = createLimiter(40);
  return {
    async check(name, signal) {
      await delay(300);
      signal?.throwIfAborted();
      count();
      return { available: !TAKEN.includes(name), alternatives: alternativesTo(name) };
    },
  };
};
