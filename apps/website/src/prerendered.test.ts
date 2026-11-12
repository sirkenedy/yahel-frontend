import { describe, expect, it } from 'vitest';
import { isPrerenderedFor } from './prerendered';

describe('isPrerenderedFor', () => {
  it('takes over the page that was written for this address', () => {
    expect(isPrerenderedFor('/about', { pathname: '/about', hash: '' })).toBe(true);
    expect(isPrerenderedFor('/', { pathname: '/', hash: '' })).toBe(true);
  });

  it('draws afresh when nothing was written into the root', () => {
    expect(isPrerenderedFor(undefined, { pathname: '/', hash: '' })).toBe(false);
  });

  it('draws afresh when a host answered an unknown address with another page', () => {
    expect(isPrerenderedFor('/', { pathname: '/no-such-page', hash: '' })).toBe(false);
    expect(isPrerenderedFor('/', { pathname: '/about/', hash: '' })).toBe(false);
  });

  it('draws afresh for a link into a section, which the written page does not mark', () => {
    expect(isPrerenderedFor('/', { pathname: '/', hash: '#products' })).toBe(false);
  });
});
