import { describe, expect, it } from 'vitest';
import { businessMessages as m } from './messages';
import { businessNameProblem, cardCodeProblem, cardNumberProblem, cityProblem, confirmProblem, contactEmailProblem, domainProblem, expiryProblemOf, firstNameProblem, largeTeamProblem, lastNameProblem, nameOnCardProblem, normaliseDomain, normaliseUsername, passwordProblem, phoneProblem, securityCodeProblem, slugOf, slugOfDomain, stateProblem, streetProblem, usernameFromName, usernameProblem } from './validation';

describe('the business and the person', () => {
  it('asks for a business name of a length the backend takes', () => {
    expect(businessNameProblem(' ')).toBe(m.businessNameRequired);
    expect(businessNameProblem('x'.repeat(101))).toBe(m.businessNameTooLong);
    expect(businessNameProblem('Northwind Studio')).toBeNull();
  });

  it('asks for a first name, allows no last name, and limits both', () => {
    expect(firstNameProblem('')).toBe(m.firstNameRequired);
    expect(firstNameProblem('x'.repeat(51))).toBe(m.nameTooLong);
    expect(firstNameProblem('Amara')).toBeNull();
    expect(lastNameProblem('')).toBeNull();
    expect(lastNameProblem('x'.repeat(51))).toBe(m.nameTooLong);
  });

  it('asks for an address shaped like an email', () => {
    expect(contactEmailProblem('amara')).toBe(m.contactEmailInvalid);
    expect(contactEmailProblem('amara@mail.example')).toBeNull();
  });
});

describe('the domain', () => {
  it('tidies what people type around a domain', () => {
    expect(normaliseDomain('  @Northwind.Example ')).toBe('northwind.example');
  });

  it.each(['northwind.example', 'mail.northwind.example', 'north-wind.example', 'a1.example'])('accepts %s', (domain) => {
    expect(domainProblem(domain)).toBeNull();
  });

  it.each(['northwind', 'https://northwind.example', 'amara@northwind.example', 'north wind.example', '-northwind.example', 'northwind..example', 'northwind.e', 'northwind.123'])('refuses %s', (domain) => {
    expect(domainProblem(domain)).toBe(m.domainInvalid);
  });

  it('asks for one when there is none', () => {
    expect(domainProblem('  ')).toBe(m.domainRequired);
  });
});

describe('the administrator', () => {
  it('takes letters, numbers and full stops between them', () => {
    for (const name of ['amara', 'amara.okafor', 'a1', 'Amara']) expect(usernameProblem(name)).toBeNull();
    for (const name of ['a', '', 'a.', '.amara', 'amara..o', 'amara okafor', 'amara@x', 'amára']) expect(usernameProblem(name)).toBe(m.usernameInvalid);
    expect(normaliseUsername(' Amara ')).toBe('amara');
  });

  it('guesses a username from the first name', () => {
    expect(usernameFromName('Amara')).toBe('amara');
    expect(usernameFromName("O'Neil Jr")).toBe('oneiljr');
    expect(usernameFromName('')).toBe('admin');
  });

  it('applies the new-password rule and asks for the same password twice', () => {
    expect(passwordProblem('')).toBe(m.newPasswordRequired);
    expect(passwordProblem('short')).toBe(m.newPasswordTooShort('a capital letter, a number and a symbol'));
    expect(passwordProblem('Northwind Lagos 2026!')).toBeNull();
    expect(confirmProblem('', 'x')).toBe(m.confirmRequired);
    expect(confirmProblem('y', 'x')).toBe(m.confirmMismatch);
    expect(confirmProblem('x', 'x')).toBeNull();
  });
});

describe('the address', () => {
  it('asks for a street, a city and a phone that could be reached', () => {
    expect(streetProblem(' ')).toBe(m.streetRequired);
    expect(cityProblem('')).toBe(m.cityRequired);
    expect(phoneProblem('803 55')).toBe(m.phoneInvalid);
    expect([streetProblem('12 Admiralty Way'), cityProblem('Lekki'), phoneProblem('803 555 0142')]).toEqual([null, null, null]);
  });

  it('words a missing state as a choice where the country lists its states, and as typing elsewhere', () => {
    expect(stateProblem('', true)).toBe(m.stateRequired);
    expect(stateProblem('', false)).toBe(m.regionRequired);
    expect(stateProblem('Lagos', true)).toBeNull();
  });
});

describe('checkout', () => {
  it('takes a whole number above the largest chip for a large team', () => {
    expect(largeTeamProblem('11', 10)).toBeNull();
    for (const typed of ['10', '7', '', 'many', '11.5']) expect(largeTeamProblem(typed, 10)).toBe(m.seatsMoreInvalid(11));
  });

  it('says what is wrong with each card field, in words', () => {
    expect(cardNumberProblem('')).toBe(m.cardNumberRequired);
    expect(cardNumberProblem('4084 0840 8408 4082')).toBe(m.cardNumberInvalid);
    expect(cardNumberProblem('4084 0840 8408 4081')).toBeNull();
    const today = new Date(2026, 10, 22);
    expect(expiryProblemOf('1', today)).toBe(m.expiryInvalid);
    expect(expiryProblemOf('01/20', today)).toBe(m.expired);
    expect(expiryProblemOf('08/31', today)).toBeNull();
    expect(securityCodeProblem('12')).toBe(m.securityCodeInvalid);
    expect(securityCodeProblem('123')).toBeNull();
    expect(nameOnCardProblem(' ')).toBe(m.nameOnCardRequired);
    expect(nameOnCardProblem('Amara Okafor')).toBeNull();
  });

  it('asks for all six digits of the bank’s code', () => {
    expect(cardCodeProblem('48291')).toBe(m.cardCodeIncomplete);
    expect(cardCodeProblem('482913')).toBeNull();
  });
});

describe('the workspace’s short name', () => {
  it('is made from the business name, in the characters the backend takes', () => {
    expect(slugOf('Northwind Studio', 'northwind.example')).toBe('northwind-studio');
    expect(slugOf('  Ọja & Sons, Ltd. ', 'oja.example')).toBe('ja-sons-ltd');
    expect(slugOf('x'.repeat(80), 'x.example')).toHaveLength(50);
    expect(slugOf(`${'x'.repeat(49)} y`, 'x.example')).toBe('x'.repeat(49));
  });

  it('falls back to the domain when the name leaves too little', () => {
    expect(slugOf('日本', 'nihon.example')).toBe('nihon-example');
    expect(slugOf('A', 'a-co.example')).toBe('a-co-example');
    expect(slugOfDomain('mail.northwind.example')).toBe('mail-northwind-example');
  });

  it('always matches what the backend requires', () => {
    for (const slug of [slugOf('Northwind Studio', 'n.example'), slugOf('!!', 'northwind.example'), slugOfDomain('a1.example')]) expect(slug).toMatch(/^[a-z0-9-]{2,50}$/);
  });
});
