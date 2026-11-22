import { ApiError } from '../errors';

/** Waits the way a network round trip would. Tests pass a version that resolves at once. */
export type Delay = (ms: number) => Promise<void>;

export const realDelay: Delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Allows `limit` calls, then refuses the way the backend refuses too many requests. */
export const createLimiter = (limit: number) => {
  let used = 0;
  return () => {
    used += 1;
    if (used > limit) throw new ApiError({ status: 429, code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please slow down' });
  };
};
