export const homeMessages = {
  documentTitle: 'Yahel',
  eyebrow: 'Yahel Workspace',
  title: 'Everything your work needs. One account.',
  lead: 'Mail, calendar, files, documents and meetings that work together. Free for you, and built to run a whole organisation.',
  createAccount: 'Create an account',
  business: 'Set up your business',
  dockLabel: 'Products',
  // Sample content for the picture of the product in the hero. None of it is a fact about Yahel.
  window: {
    label: 'The Yahel home screen, showing today’s events, unread mail and recent files.',
    address: 'yahel.com',
    initials: 'AO',
    context: 'Personal',
    greeting: 'Good morning, Amara',
    today: 'Today',
    events: [
      { name: 'Design review', time: '10:00' },
      { name: 'Lunch with Tobi', time: '13:00' },
      { name: 'Budget check-in', time: '15:30' },
    ],
    mail: 'Unread mail',
    unread: [
      { from: 'Ngozi Eze', subject: 'Contract draft for your review' },
      { from: 'Northwind Studio', subject: 'Your invitation to join' },
    ],
    files: 'Recent files',
    recent: [
      { name: 'Launch plan', product: 'docs' },
      { name: 'Q3 budget', product: 'sheets' },
      { name: 'Board update', product: 'slides' },
    ],
  },
  products: {
    eyebrow: 'Products',
    title: 'Nine apps. One way of working.',
    lead: 'Each app has its own address and opens with the same account. Sign in once and move between them.',
    tabsLabel: 'Products',
    open: (host: string) => `Open ${host}`,
  },
  accounts: {
    eyebrow: 'Accounts',
    title: 'For you. For your whole organisation.',
    lead: 'One identity holds your personal account and your work. Switch between them without signing out.',
    personal: {
      initials: 'AO',
      title: 'For yourself',
      text: 'A free personal account with mail, calendar, storage and documents. It is yours, whatever job you hold.',
      points: ['Your own address', 'See and sign out your devices', 'Export or delete your data yourself'],
      action: 'Create a personal account',
    },
    business: {
      initials: 'NS',
      title: 'For work or your business',
      text: 'Bring your own domain. Give everyone an address, and manage people, devices and security from one place.',
      points: ['Mail on your company domain', 'Invite people and organise teams', 'Require two-step verification'],
      action: 'Set up your business',
    },
  },
  security: {
    eyebrow: 'Security and control',
    title: 'You can always see who has access.',
    points: [
      { title: 'Two-step verification', text: 'Add an authenticator app and backup codes. Trust a device so it asks less often.' },
      { title: 'Devices and sessions', text: 'See every device signed in to your account, and sign any of them out from wherever you are.' },
      { title: 'Your data is yours', text: 'Request a copy of your data or delete your account from your settings, without asking anyone.' },
      { title: 'Clear when managed', text: 'A work account always says which organisation manages it and what that organisation can see.' },
    ],
  },
  plans: {
    eyebrow: 'Plans',
    title: 'Start free.',
    plans: [
      { name: 'Personal', price: 'Free', text: 'Every app, with [STORAGE] of storage.' },
      { name: 'Business', price: '[YOUR PRICE]', text: 'Per person, each month. Your domain, admin controls and [STORAGE] each.' },
    ],
  },
  closing: {
    title: 'One account for all of it.',
    action: 'Create an account',
  },
} as const;
