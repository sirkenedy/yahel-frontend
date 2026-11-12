import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeHero } from './home-hero';

describe('HomeHero', () => {
  it('says what Yahel is in one heading and one paragraph', () => {
    render(<HomeHero signInUrl="https://app.yahel.example/sign-in" />);

    expect(screen.getByText('Yahel Workspace')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Everything your work needs. One account.' })).toBeInTheDocument();
    expect(screen.getByText('Mail, calendar, files, documents and meetings that work together. Free for you, and built to run a whole organisation.')).toBeInTheDocument();
    expect(document.title).toBe('Yahel');
  });

  it('offers one main action, to sign-in on the app, and a second as a plain link', () => {
    render(<HomeHero signInUrl="https://app.yahel.example/sign-in" />);

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['Create an account', 'Set up your business']);
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', 'https://app.yahel.example/sign-in');
    expect(screen.getByRole('link', { name: 'Set up your business' })).toHaveAttribute('href', '#accounts');
  });

  it('brings its four blocks in one after another, starting with the first', () => {
    render(<HomeHero signInUrl="https://app.yahel.example/sign-in" />);

    const position = (element: HTMLElement) => element.closest<HTMLElement>('[data-reveal]')!.style.getPropertyValue('--reveal-index');
    expect([
      position(screen.getByText('Yahel Workspace')),
      position(screen.getByRole('heading', { level: 1 })),
      position(screen.getByText(/^Mail, calendar, files/)),
      position(screen.getByRole('link', { name: 'Create an account' })),
    ]).toEqual(['0', '1', '2', '3']);
  });
});
