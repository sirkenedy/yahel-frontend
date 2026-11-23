import { describe, expect, it } from 'vitest';
import { flowMessages as fm } from '../../flow/messages';
import { adminMessages as m } from './messages';
import { codeProblem, phoneProblem } from './validation';

describe('phoneProblem', () => {
  it('asks for a number when there is none', () => {
    expect(phoneProblem('')).toBe(m.phoneRequired);
    expect(phoneProblem('   ')).toBe(m.phoneRequired);
  });

  it.each(['803 555 0142', '0803-555-0142', '(0803) 555 0142', '8035550'])('takes a national number as people write it: %s', (value) => {
    expect(phoneProblem(value)).toBeNull();
  });

  it.each(['call me', '+234 803 555 0142', '803555', '8035550142803555'])('refuses what is not a national number: %s', (value) => {
    expect(phoneProblem(value)).toBe(m.phoneInvalid);
  });
});

describe('codeProblem', () => {
  it('wants all six characters', () => {
    expect(codeProblem('K9mP2')).toBe(fm.emailedCode.codeIncomplete);
    expect(codeProblem('K9mP2r')).toBeNull();
  });
});
