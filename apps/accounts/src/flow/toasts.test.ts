import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { dismissToast, say, useToast } from './toasts';

afterEach(() => act(() => dismissToast()));

describe('toasts', () => {
  it('shows nothing until something is said, then what was said, as a success unless told otherwise', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current).toBeNull();

    act(() => say('New code sent. Older codes no longer work.'));
    expect(result.current).toMatchObject({ text: 'New code sent. Older codes no longer work.', tone: 'success' });

    act(() => say('Yahel will be available in Yorùbá soon.', 'info'));
    expect(result.current).toMatchObject({ text: 'Yahel will be available in Yorùbá soon.', tone: 'info' });
  });

  it('tells two toasts with the same words apart, so the second starts its own clock', () => {
    const { result } = renderHook(() => useToast());

    act(() => say('You’re back online.'));
    const first = result.current?.id;
    act(() => say('You’re back online.'));

    expect(result.current?.id).not.toBe(first);
  });

  it('puts the toast away when dismissed, for everyone watching', () => {
    const one = renderHook(() => useToast());
    const two = renderHook(() => useToast());

    act(() => say('Copied.'));
    expect(two.result.current?.text).toBe('Copied.');

    act(() => dismissToast());
    expect(one.result.current).toBeNull();
    expect(two.result.current).toBeNull();
  });

  it('stops telling a watcher that has gone', () => {
    const { result, unmount } = renderHook(() => useToast());
    unmount();

    act(() => say('Copied.'));
    expect(result.current).toBeNull();
  });
});
