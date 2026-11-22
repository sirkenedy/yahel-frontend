import { describe, expect, it } from 'vitest';
import { datePartOrder, monthNames, writtenDate } from './dates';

describe('dates', () => {
  it('orders the parts of a date the way the locale writes them', () => {
    expect(datePartOrder('en-NG')).toEqual(['day', 'month', 'year']);
    expect(datePartOrder('en-US')).toEqual(['month', 'day', 'year']);
    expect(datePartOrder('ja-JP')).toEqual(['year', 'month', 'day']);
  });

  it('names the months in the reader’s language', () => {
    expect(monthNames('en-NG')).toHaveLength(12);
    expect(monthNames('en-NG')[2]).toBe('March');
    expect(monthNames('fr')[2]).toBe('mars');
  });

  it('writes a date out in words', () => {
    expect(writtenDate({ day: 14, month: 3, year: 1994 }, 'en-NG')).toBe('14 March 1994');
  });
});
