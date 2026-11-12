import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroWindow } from './hero-window';

const picture = () => screen.getByRole('img');
const progress = () => picture().style.getPropertyValue('--scroll-progress');
const scrollTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersToNextFrame();
  });
};

describe('HeroWindow', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    scrollTo(0);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows a sample day: three events, two unread messages and three recent files', () => {
    render(<HeroWindow />);

    for (const text of ['yahel.com', 'Personal', 'Design review', '10:00', 'Lunch with Tobi', '13:00', 'Budget check-in', '15:30', 'Ngozi Eze', 'Contract draft for your review', 'Northwind Studio', 'Your invitation to join', 'Launch plan', 'Q3 budget', 'Board update']) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it('follows the first 520 of scroll, from tilted at the top to flat', () => {
    render(<HeroWindow />);
    expect(progress()).toBe('0');

    scrollTo(260);
    expect(progress()).toBe('0.5');

    scrollTo(520);
    expect(progress()).toBe('1');

    scrollTo(2000);
    expect(progress()).toBe('1');
  });

  it('is left flat and still when the reader asks for reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ media: query, matches: query === '(prefers-reduced-motion: reduce)' }));
    render(<HeroWindow />);

    scrollTo(260);

    expect(progress()).toBe('');
  });
});
