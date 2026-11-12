import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeAccounts, HomeClosing, HomePlans, HomeSecurity } from './home-sections';
import { signInUrl } from './home-test-data';

const card = (title: string) => within(screen.getByRole('heading', { level: 3, name: title }).parentElement!);

describe('HomeAccounts', () => {
  it('says the account is for one person and for a whole organisation, and is the target of links to #accounts', () => {
    const { container } = render(<HomeAccounts signInUrl={signInUrl} />);

    expect(container.querySelector('#accounts')).toContainElement(screen.getByRole('heading', { level: 2, name: 'For you. For your whole organisation.' }));
    expect(screen.getByText('One identity holds your personal account and your work. Switch between them without signing out.')).toBeInTheDocument();
  });

  it('describes the personal account, with its own action to sign-in on the app', () => {
    render(<HomeAccounts signInUrl={signInUrl} />);
    const personal = card('For yourself');

    expect(personal.getByText('A free personal account with mail, calendar, storage and documents. It is yours, whatever job you hold.')).toBeInTheDocument();
    expect(personal.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Your own address', 'See and sign out your devices', 'Export or delete your data yourself']);
    expect(personal.getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([['Create a personal account', signInUrl]]);
  });

  it('describes the account for work, with its own action to sign-in on the app', () => {
    render(<HomeAccounts signInUrl={signInUrl} />);
    const business = card('For work or your business');

    expect(business.getByText('Bring your own domain. Give everyone an address, and manage people, devices and security from one place.')).toBeInTheDocument();
    expect(business.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Mail on your company domain', 'Invite people and organise teams', 'Require two-step verification']);
    expect(business.getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([['Set up your business', signInUrl]]);
  });
});

describe('HomeSecurity', () => {
  it('explains four ways the reader stays in control, and is the target of links to #security', () => {
    const { container } = render(<HomeSecurity />);

    expect(container.querySelector('#security')).toContainElement(screen.getByRole('heading', { level: 2, name: 'You can always see who has access.' }));
    expect(screen.getByText('Security and control')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => [heading.textContent, heading.nextElementSibling?.textContent])).toEqual([
      ['Two-step verification', 'Add an authenticator app and backup codes. Trust a device so it asks less often.'],
      ['Devices and sessions', 'See every device signed in to your account, and sign any of them out from wherever you are.'],
      ['Your data is yours', 'Request a copy of your data or delete your account from your settings, without asking anyone.'],
      ['Clear when managed', 'A work account always says which organisation manages it and what that organisation can see.'],
    ]);
  });
});

describe('HomePlans', () => {
  it('shows what is decided and leaves the rest as marked placeholders, exactly as written', () => {
    const { container } = render(<HomePlans />);

    expect(container.querySelector('#plans')).toContainElement(screen.getByRole('heading', { level: 2, name: 'Start free.' }));
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => [...heading.parentElement!.children].map((line) => line.textContent))).toEqual([
      ['Personal', 'Free', 'Every app, with [STORAGE] of storage.'],
      ['Business', '[YOUR PRICE]', 'Per person, each month. Your domain, admin controls and [STORAGE] each.'],
    ]);
  });

  it('states no price, amount of storage or other figure that has not been decided', () => {
    const { container } = render(<HomePlans />);

    expect(container.textContent).not.toMatch(/\d/);
  });
});

describe('HomeClosing', () => {
  it('ends the page with one action, to sign-in on the app', () => {
    render(<HomeClosing signInUrl={signInUrl} />);

    expect(screen.getByRole('heading', { level: 2, name: 'One account for all of it.' })).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([['Create an account', signInUrl]]);
  });
});
