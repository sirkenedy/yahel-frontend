import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './home-page';
import { reachable, signInUrl, testProducts } from './home-test-data';

const renderPage = () =>
  render(
    <HomePage
      signInUrl={signInUrl}
      products={testProducts}
      selectedId="mail"
      picks={0}
      onSelect={vi.fn()}
      onPickProduct={vi.fn()}
      productsLink={{ href: '/#products' }}
      accountsLink={{ href: '/#accounts' }}
    />,
  );

describe('HomePage', () => {
  it('has one level-one heading and answers a visitor’s questions in order', () => {
    renderPage();

    expect(reachable(screen.getAllByRole('heading')).map((heading) => `${heading.tagName} ${heading.textContent}`)).toEqual([
      'H1 Everything your work needs. One account.',
      'H2 Nine apps. One way of working.',
      'H3 Mail',
      'H2 For you. For your whole organisation.',
      'H3 For yourself',
      'H3 For work or your business',
      'H2 You can always see who has access.',
      'H3 Two-step verification',
      'H3 Devices and sessions',
      'H3 Your data is yours',
      'H3 Clear when managed',
      'H2 Start free.',
      'H3 Personal',
      'H3 Business',
      'H2 One account for all of it.',
    ]);
  });

  it('gives every section the bar links to an address of its own', () => {
    const { container } = renderPage();

    expect([...container.querySelectorAll('section[id]')].map((section) => section.id)).toEqual(['products', 'accounts', 'security', 'plans']);
  });

  it('sends every account action to sign-in on the app', () => {
    renderPage();

    const actions = ['Create an account', 'Create a personal account', 'Set up your business'].flatMap((name) => screen.getAllByRole('link', { name }));
    expect(actions.map((link) => link.getAttribute('href'))).toEqual([signInUrl, signInUrl, signInUrl, '/#accounts', signInUrl]);
  });

  it('names the document for this page', () => {
    renderPage();

    expect(document.title).toBe('Yahel');
  });
});
