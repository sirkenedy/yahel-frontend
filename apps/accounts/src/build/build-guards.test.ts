import { describe, expect, it } from 'vitest';
import { assertStandInsAllowed } from './stand-in-guard';

describe('assertStandInsAllowed', () => {
  it('refuses a build with stand-ins on', () => {
    expect(() => assertStandInsAllowed('build', { VITE_STAND_INS: 'on' })).toThrow(/stand-in data/);
    expect(() => assertStandInsAllowed('build', { VITE_STAND_INS: 'on', VITE_STAND_INS_ALLOW_BUILD: 'yes' })).toThrow(/stand-in data/);
  });

  it('allows a build that declares itself a demo', () => {
    expect(() => assertStandInsAllowed('build', { VITE_STAND_INS: 'on', VITE_STAND_INS_ALLOW_BUILD: 'demo' })).not.toThrow();
  });

  it('allows a build without stand-ins, and the development server with them', () => {
    expect(() => assertStandInsAllowed('build', {})).not.toThrow();
    expect(() => assertStandInsAllowed('build', { VITE_STAND_INS: 'off' })).not.toThrow();
    expect(() => assertStandInsAllowed('serve', { VITE_STAND_INS: 'on' })).not.toThrow();
  });
});
