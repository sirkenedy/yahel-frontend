import { describe, expect, it } from 'vitest';
import { slotInPath, slotOf } from './slot';

describe('slots in addresses', () => {
  it('reads a slot of 0 to 9 and nothing else', () => {
    expect(slotOf('0')).toBe(0);
    expect(slotOf('9')).toBe(9);
    for (const value of [undefined, '', '10', '-1', 'a', '1.5', ' 1']) expect(slotOf(value)).toBeNull();
  });

  it('finds the slot at the start of a path', () => {
    expect(slotInPath('/u/3/')).toBe(3);
    expect(slotInPath('/u/3')).toBe(3);
    expect(slotInPath('/u/3/account')).toBe(3);
    expect(slotInPath('/sign-in')).toBeNull();
    expect(slotInPath('/u/12/')).toBeNull();
    expect(slotInPath('/x/u/1/')).toBeNull();
  });
});
