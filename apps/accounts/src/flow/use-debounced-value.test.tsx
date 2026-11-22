import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './use-debounced-value';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useDebouncedValue', () => {
  it('holds the old value until the new one has stopped changing', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'a' } });

    rerender({ value: 'am' });
    act(() => void vi.advanceTimersByTime(200));
    rerender({ value: 'ama' });
    act(() => void vi.advanceTimersByTime(200));
    expect(result.current).toBe('a');

    act(() => void vi.advanceTimersByTime(100));
    expect(result.current).toBe('ama');
  });
});
