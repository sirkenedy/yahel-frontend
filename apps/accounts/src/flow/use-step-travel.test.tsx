import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStepTravel } from './use-step-travel';

const order = ['name', 'birth', 'address'];
const directionOf = (from: string, to: string) => (order.indexOf(to) < order.indexOf(from) ? 'back' : 'forward');

describe('useStepTravel', () => {
  it('starts forward on the first visit', () => {
    const { result } = renderHook(() => useStepTravel('name', directionOf));

    expect(result.current).toEqual({ step: 'name', direction: 'forward', visit: 0 });
  });

  it('counts each step shown and says which way the person moved', () => {
    const { result, rerender } = renderHook(({ step }) => useStepTravel(step, directionOf), { initialProps: { step: 'name' } });

    rerender({ step: 'address' });
    expect(result.current).toEqual({ step: 'address', direction: 'forward', visit: 1 });

    rerender({ step: 'birth' });
    expect(result.current).toEqual({ step: 'birth', direction: 'back', visit: 2 });

    rerender({ step: 'birth' });
    expect(result.current.visit).toBe(2);
  });
});
