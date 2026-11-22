import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnline, useSecondsLeft, useSlow } from './use-waits';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const pass = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe('useSlow', () => {
  it('says nothing for a short wait, and speaks up once it has lasted 1.2 seconds', () => {
    const { result } = renderHook(({ busy }) => useSlow(busy), { initialProps: { busy: true } });

    pass(1199);
    expect(result.current).toBe(false);
    pass(1);
    expect(result.current).toBe(true);
  });

  it('stops when the wait ends, and counts the next wait from its own start', () => {
    const { result, rerender } = renderHook(({ busy }) => useSlow(busy), { initialProps: { busy: true } });
    pass(1500);
    expect(result.current).toBe(true);

    rerender({ busy: false });
    expect(result.current).toBe(false);

    rerender({ busy: true });
    expect(result.current).toBe(false);
    pass(1000);
    expect(result.current).toBe(false);
    pass(200);
    expect(result.current).toBe(true);
  });

  it('never speaks while nothing is being waited for', () => {
    const { result } = renderHook(() => useSlow(false));

    pass(5000);
    expect(result.current).toBe(false);
  });
});

describe('useSecondsLeft', () => {
  it('counts whole seconds down to nought and stays there', () => {
    const until = Date.now() + 2500;
    const { result } = renderHook(() => useSecondsLeft(until));
    expect(result.current).toBe(3);

    pass(1000);
    expect(result.current).toBe(2);
    pass(2000);
    expect(result.current).toBe(0);
    pass(5000);
    expect(result.current).toBe(0);
  });

  it('is nought when there is nothing to wait for, or the time has passed', () => {
    expect(renderHook(() => useSecondsLeft(null)).result.current).toBe(0);
    expect(renderHook(() => useSecondsLeft(undefined)).result.current).toBe(0);
    expect(renderHook(() => useSecondsLeft(Date.now() - 1000)).result.current).toBe(0);
  });

  it('starts again when given a later time', () => {
    const { result, rerender } = renderHook(({ until }) => useSecondsLeft(until), { initialProps: { until: Date.now() + 1000 } });
    pass(1000);
    expect(result.current).toBe(0);

    rerender({ until: Date.now() + 30_000 });
    expect(result.current).toBe(30);
    pass(6000);
    expect(result.current).toBe(24);
  });
});

describe('useOnline', () => {
  it('follows what the browser says about the connection', () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { result } = renderHook(() => useOnline());
    expect(result.current).toBe(true);

    onLine.mockReturnValue(false);
    act(() => void window.dispatchEvent(new Event('offline')));
    expect(result.current).toBe(false);

    onLine.mockReturnValue(true);
    act(() => void window.dispatchEvent(new Event('online')));
    expect(result.current).toBe(true);
  });

  it('stops listening when it is no longer shown', () => {
    const removed = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOnline());

    unmount();
    expect(removed.mock.calls.map(([name]) => name)).toEqual(expect.arrayContaining(['online', 'offline']));
  });
});
