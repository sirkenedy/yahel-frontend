// STAND-IN. Missing signal: when the service is down for planned work, nothing says until when. Needed:
// GET /v1/status (no session, answered by the edge while the API is down) with the window in progress,
// or `Retry-After` on the 503 itself, exposed to browsers. The stand-in announces a two-hour window that
// began an hour ago, so the maintenance screen can be seen with its times.
import type { ServiceStatus } from '../capabilities';
import type { Delay } from './timing';

const HOUR = 3_600_000;

export const createServiceStatusStandIn = (delay: Delay, now: () => number = Date.now): ServiceStatus => ({
  async window() {
    await delay(200);
    const started = Math.floor(now() / HOUR) * HOUR - HOUR;
    return { from: new Date(started).toISOString(), until: new Date(started + 2 * HOUR).toISOString() };
  },
});
