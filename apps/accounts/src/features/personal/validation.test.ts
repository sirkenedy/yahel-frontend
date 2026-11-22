import { describe, expect, it } from 'vitest';
import { personalMessages as m } from './messages';
import { addressFromName, addressProblem, ageOn, codeProblem, contactProblem, firstNameProblem, isoBirthDate, lastNameProblem, normaliseAddress, ownEmailProblem, passwordProblem, readBirthDate, recoveryProblems } from './validation';

const today = new Date(Date.UTC(2026, 10, 22));

describe('names', () => {
  it('needs a first name of at most 50 characters, and allows no last name', () => {
    expect(firstNameProblem('  ')).toBe(m.firstNameRequired);
    expect(firstNameProblem('A'.repeat(51))).toBe(m.nameTooLong);
    expect(firstNameProblem('Amara')).toBeNull();
    expect(lastNameProblem('')).toBeNull();
    expect(lastNameProblem('O'.repeat(51))).toBe(m.nameTooLong);
  });
});

describe('date of birth', () => {
  it('reads a complete date', () => {
    expect(readBirthDate({ day: '14', month: '3', year: '1994' }, today)).toEqual({ problems: {}, birth: { day: 14, month: 3, year: 1994 } });
  });

  it('says what is wrong with each part', () => {
    expect(readBirthDate({ day: '', month: '', year: '' }, today).problems).toEqual({ day: m.dayInvalid, month: m.monthRequired, year: m.yearInvalid });
    expect(readBirthDate({ day: '32', month: '3', year: '94' }, today).problems).toEqual({ day: m.dayInvalid, year: m.yearInvalid });
    expect(readBirthDate({ day: '1x', month: '3', year: '1994' }, today).problems).toEqual({ day: m.dayInvalid });
    expect(readBirthDate({ day: '14', month: '3', year: '1899' }, today).problems).toEqual({ year: m.yearInvalid });
    expect(readBirthDate({ day: '14', month: '3', year: '2027' }, today).problems).toEqual({ year: m.yearInvalid });
  });

  it('checks the day against its month and year', () => {
    expect(readBirthDate({ day: '31', month: '4', year: '1994' }, today).problems).toEqual({ day: m.dayInvalid });
    expect(readBirthDate({ day: '29', month: '2', year: '1995' }, today).problems).toEqual({ day: m.dayInvalid });
    expect(readBirthDate({ day: '29', month: '2', year: '1996' }, today).birth).toEqual({ day: 29, month: 2, year: 1996 });
  });

  it('counts age to the day: thirteen today is old enough, thirteen tomorrow is not', () => {
    expect(readBirthDate({ day: '22', month: '11', year: '2013' }, today).birth).not.toBeNull();
    expect(readBirthDate({ day: '23', month: '11', year: '2013' }, today)).toEqual({ problems: { year: m.tooYoung }, birth: null });
    expect(ageOn({ day: 14, month: 3, year: 1994 }, today)).toBe(32);
    expect(ageOn({ day: 23, month: 11, year: 1994 }, today)).toBe(31);
  });

  it('writes the date as the backend takes it', () => {
    expect(isoBirthDate({ day: 14, month: 3, year: 1994 })).toBe('1994-03-14T00:00:00.000Z');
  });
});

describe('Yahel address', () => {
  it('turns what is typed into a candidate name', () => {
    expect(normaliseAddress('Amara Okafor')).toBe('amara.okafor');
    expect(addressFromName('Amara', 'Okafor')).toBe('amara.okafor');
    expect(addressFromName('Adé-Ola', '')).toBe('adola');
  });

  it.each([
    ['', m.addressRequired],
    ['amara_okafor', m.addressCharacters],
    ['.amara', m.addressDots],
    ['amara.', m.addressDots],
    ['amara..okafor', m.addressDots],
    ['abc', m.addressTooShort],
    ['a'.repeat(31), m.addressTooLong],
    ['amara.okafor94', null],
  ])('"%s" → %s', (name, problem) => expect(addressProblem(name)).toBe(problem));
});

describe('existing email and password', () => {
  it('needs something shaped like an email address', () => {
    expect(ownEmailProblem('amara')).toBe(m.ownEmailInvalid);
    expect(ownEmailProblem('amara@mail.example')).toBeNull();
  });

  it('applies the design’s length and the backend’s variety', () => {
    expect(passwordProblem('Short-1')).toBe(m.passwordTooShort);
    expect(passwordProblem('sunrise over lekki 94')).toBe(m.passwordTooPlain);
    expect(passwordProblem('Sunrise over Lekki 94')).toBeNull();
  });
});

describe('recovery', () => {
  const own = 'amara.okafor@yahel.example';

  it('wants a phone, an email or both', () => {
    expect(recoveryProblems({ phone: '', email: ' ' }, own)).toEqual({ phone: m.recoveryEmpty });
    expect(recoveryProblems({ phone: '803 555 0142', email: '' }, own)).toEqual({});
    expect(recoveryProblems({ phone: '', email: 'amara@personal.example' }, own)).toEqual({});
  });

  it('checks each that was given', () => {
    expect(recoveryProblems({ phone: '80355', email: 'amara@' }, own)).toEqual({ phone: m.phoneInvalid, email: m.recoveryEmailInvalid });
    expect(recoveryProblems({ phone: '', email: ' Amara.Okafor@yahel.example' }, own)).toEqual({ email: m.recoveryEmailSame });
  });
});

describe('codes and the trusted contact', () => {
  it('needs all six characters', () => {
    expect(codeProblem('B4nQ7')).toBe(m.codeIncomplete);
    expect(codeProblem('B4nQ7x')).toBeNull();
  });

  it('needs someone else’s email address', () => {
    const own = ['amara.okafor@yahel.example', 'amara.o@personal.example', ''];
    expect(contactProblem('', own)).toBe(m.contactRequired);
    expect(contactProblem('chidi', own)).toBe(m.contactInvalid);
    expect(contactProblem('Amara.O@personal.example', own)).toBe(m.contactOwn);
    expect(contactProblem('chidi.eze@personal.example', own)).toBeNull();
  });
});
