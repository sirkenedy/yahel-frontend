import { describe, expect, it } from 'vitest';
import { flowMessages as m } from './messages';

describe('timeOf', () => {
  const now = new Date(2026, 10, 22, 10, 0).getTime();

  it('gives the hour for a time today', () => {
    expect(m.timeOf(new Date(2026, 10, 22, 14, 32).getTime(), now)).toMatch(/^14:32$/);
  });

  it('gives the date with the hour for a time on another day', () => {
    const tomorrow = m.timeOf(new Date(2026, 10, 23, 9, 5).getTime(), now);

    expect(tomorrow).toContain('23');
    expect(tomorrow).toContain('09:05');
    expect(tomorrow).toBe(m.momentOf(new Date(2026, 10, 23, 9, 5).getTime()));
  });

  it.each(['soon', '', Number.NaN, Number.POSITIVE_INFINITY, 8.7e15])('answers null instead of throwing for %s', (value) => {
    expect(m.timeOf(value, now)).toBeNull();
  });
});
