import { describe, expect, it } from 'vitest';
import { labelOf } from './use-account-menu';

describe('labelOf', () => {
  it('says admin, the organisation or work account, and personal only for a personal account', () => {
    expect(labelOf({ type: 'admin', organisation: 'Northwind Studio' }, 'Personal')).toBe('Admin · Northwind Studio');
    expect(labelOf({ type: 'member', organisation: 'Northwind Studio' }, 'Personal')).toBe('Northwind Studio');
    expect(labelOf({ type: 'work' }, 'Personal')).toBe('Work account');
    expect(labelOf({ type: 'personal' }, 'Personal')).toBe('Personal');
  });
});
