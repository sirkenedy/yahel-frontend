import type { KnownAccount } from '../capabilities';
import type { Profile } from '../types';

export const demoProfile: Profile = {
  id: '64f0000000000000000000d1',
  globalId: 'g-demo-amara',
  email: 'amara.okafor@yahel.example',
  firstName: 'Amara',
  lastName: 'Okafor',
  displayName: 'Amara Okafor',
  photo: null,
};

export const demoAccounts: readonly KnownAccount[] = [
  { name: 'Amara Okafor', email: 'amara.okafor@yahel.example', kind: 'person' },
  { name: 'Amara Okafor', email: 'amara@northwind.example', kind: 'organisation', organisation: 'Northwind Studio' },
];

export const DEMO_PHONE = '+234 ••• ••• ••42';
