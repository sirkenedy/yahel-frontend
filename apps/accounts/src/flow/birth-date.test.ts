import { describe, expect, it } from 'vitest';
import { ageOn, isoBirthDate, readBirthDate } from './birth-date';

const words = { dayInvalid: 'day', monthRequired: 'month', yearInvalid: 'year', tooYoung: 'young' };
const today = new Date(Date.UTC(2026, 10, 22));
const read = (day: string, month: string, year: string, minAge = 13) => readBirthDate({ day, month, year }, words, minAge, today);

describe('readBirthDate', () => {
  it('gives the date when nothing is wrong with it', () => {
    expect(read('14', '3', '1994')).toEqual({ problems: {}, birth: { day: 14, month: 3, year: 1994 } });
  });

  it('names each part that is wrong, in the flow’s own words', () => {
    expect(read('', '', '94')).toEqual({ problems: { day: 'day', month: 'month', year: 'year' }, birth: null });
    expect(read('31', '4', '1994').problems).toEqual({ day: 'day' });
    expect(read('29', '2', '2023').problems).toEqual({ day: 'day' });
    expect(read('29', '2', '2012').birth).toEqual({ day: 29, month: 2, year: 2012 });
    expect(read('1', '1', '2090').problems).toEqual({ year: 'year' });
  });

  it('refuses someone younger than the flow allows, on the year', () => {
    expect(read('23', '11', '2013')).toEqual({ problems: { year: 'young' }, birth: null });
    expect(read('22', '11', '2013').birth).not.toBeNull();
    expect(read('22', '11', '2013', 18)).toEqual({ problems: { year: 'young' }, birth: null });
  });
});

describe('ageOn and isoBirthDate', () => {
  it('counts whole years by the calendar', () => {
    expect(ageOn({ day: 22, month: 11, year: 2000 }, today)).toBe(26);
    expect(ageOn({ day: 23, month: 11, year: 2000 }, today)).toBe(25);
  });

  it('writes the date as midnight UTC of that day', () => {
    expect(isoBirthDate({ day: 14, month: 3, year: 1994 })).toBe('1994-03-14T00:00:00.000Z');
  });
});
