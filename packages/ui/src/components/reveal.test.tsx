import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Reveal, RevealGroup } from '../index';

class FakeObserver {
  static current: FakeObserver | undefined;
  observed = new Set<Element>();
  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeObserver.current = this;
  }
  observe(element: Element) {
    this.observed.add(element);
  }
  unobserve(element: Element) {
    this.observed.delete(element);
  }
  disconnect() {
    this.observed.clear();
  }
  report(element: Element, isIntersecting: boolean) {
    if (!this.observed.has(element)) return;
    act(() => this.callback([{ target: element, isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver));
  }
}

const observer = () => FakeObserver.current!;

describe('Reveal', () => {
  beforeEach(() => vi.stubGlobal('IntersectionObserver', FakeObserver));
  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-motion');
  });

  it('waits out of view, and arrives when 12% of it is seen', () => {
    render(<Reveal>Our story</Reveal>);
    const element = screen.getByText('Our story');

    expect(document.documentElement).toHaveAttribute('data-motion', 'on');
    expect(element).not.toHaveAttribute('data-in');
    expect(observer().options).toEqual({ threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    observer().report(element, false);
    expect(element).not.toHaveAttribute('data-in');

    observer().report(element, true);
    expect(element).toHaveAttribute('data-in');
  });

  it('moves once: leaving the view and coming back changes nothing', () => {
    render(<Reveal>Where we are</Reveal>);
    const element = screen.getByText('Where we are');
    observer().report(element, true);

    expect(observer().observed.has(element)).toBe(false);
    observer().report(element, false);
    expect(element).toHaveAttribute('data-in');
  });

  it('renders the element asked for and keeps its own attributes', () => {
    render(
      <Reveal as="h2" className="title" id="story">
        Our story
      </Reveal>,
    );

    const heading = screen.getByRole('heading', { level: 2, name: 'Our story' });
    expect(heading).toHaveAttribute('id', 'story');
    expect(heading).toHaveClass('title');
  });

  it('stops watching an element that is removed before it was seen', () => {
    const { unmount } = render(<Reveal>Gone</Reveal>);
    const element = screen.getByText('Gone');

    unmount();

    expect(observer().observed.has(element)).toBe(false);
  });

  it('numbers siblings in a group in order, so each starts one step after the one before', () => {
    render(
      <RevealGroup as="section" aria-label="Values">
        <Reveal>Clear</Reveal>
        <Reveal>Quiet</Reveal>
        <Reveal>One identity</Reveal>
      </RevealGroup>,
    );

    const index = (text: string) => screen.getByText(text).style.getPropertyValue('--reveal-index');
    expect(screen.getByRole('region', { name: 'Values' })).toContainElement(screen.getByText('Clear'));
    expect([index('Clear'), index('Quiet'), index('One identity')]).toEqual(['0', '1', '2']);
  });

  it('starts first on its own, and takes an explicit position when given one', () => {
    render(
      <>
        <Reveal>Alone</Reveal>
        <Reveal index={3}>Placed</Reveal>
      </>,
    );

    expect(screen.getByText('Alone').style.getPropertyValue('--reveal-index')).toBe('0');
    expect(screen.getByText('Placed').style.getPropertyValue('--reveal-index')).toBe('3');
  });

  it('leaves content visible when the browser cannot observe', () => {
    vi.unstubAllGlobals();
    expect('IntersectionObserver' in window).toBe(false);

    render(<Reveal>Readable</Reveal>);

    expect(document.documentElement).not.toHaveAttribute('data-motion');
    expect(screen.getByText('Readable')).toBeVisible();
  });
});
