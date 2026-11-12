import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrollProgress } from '../index';

function Window({ distance = 520 }: { distance?: number }) {
  return <div ref={useScrollProgress<HTMLDivElement>(distance)}>window</div>;
}

const progress = () => screen.getByText('window').style.getPropertyValue('--scroll-progress');
const scrollTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersToNextFrame();
  });
};

describe('useScrollProgress', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    scrollTo(0);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('starts at the scroll position the page already has', () => {
    render(<Window />);
    expect(progress()).toBe('0');
  });

  it('starts part-way when the page loads part-way down', () => {
    scrollTo(130);
    render(<Window />);
    expect(progress()).toBe('0.25');
  });

  it('follows the scroll position, and stays between 0 and 1', () => {
    render(<Window />);

    scrollTo(260);
    expect(progress()).toBe('0.5');

    scrollTo(520);
    expect(progress()).toBe('1');

    scrollTo(4000);
    expect(progress()).toBe('1');

    scrollTo(-40);
    expect(progress()).toBe('0');
  });

  it('measures against the distance it is given', () => {
    render(<Window distance={200} />);

    scrollTo(50);
    expect(progress()).toBe('0.25');
  });

  it('writes once a frame however many scroll events arrive, and not at all when the number has not changed', () => {
    render(<Window />);
    const write = vi.spyOn(screen.getByText('window').style, 'setProperty');

    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersToNextFrame();
    });
    expect(write).toHaveBeenCalledTimes(1);

    scrollTo(900);
    scrollTo(1400);
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('listens passively, so it never holds up scrolling', () => {
    const add = vi.spyOn(window, 'addEventListener');
    render(<Window />);

    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    add.mockRestore();
  });

  it('does not attach when the reader asks for reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ media: query, matches: query === '(prefers-reduced-motion: reduce)' }));
    const add = vi.spyOn(window, 'addEventListener');

    render(<Window />);
    scrollTo(260);

    expect(add).not.toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());
    expect(progress()).toBe('');
    add.mockRestore();
  });

  it('stops listening and clears what it wrote when the element is removed', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Window />);
    const element = screen.getByText('window');
    scrollTo(260);

    unmount();

    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(element.style.getPropertyValue('--scroll-progress')).toBe('');
    remove.mockRestore();
  });
});
