import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResendLink } from './resend-link';
import type { FlowRequest } from './use-flow-request';

const idle: FlowRequest = { isPending: false, feedback: null, clear: () => undefined };
const words = { label: 'Send a new code', waitLabel: (clock: string) => `Send a new code in ${clock}`, pendingLabel: 'Sending…' };
const pass = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('ResendLink', () => {
  it('waits thirty seconds after the step appears, saying how long in the control itself', () => {
    render(<ResendLink request={idle} onPress={vi.fn()} {...words} />);

    const link = screen.getByRole('button', { name: 'Send a new code in 0:30' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    // Still reachable, so focus is not lost while it counts.
    expect(link).not.toBeDisabled();

    pass(6000);
    expect(screen.getByRole('button', { name: 'Send a new code in 0:24' })).toBeInTheDocument();
  });

  it('ignores a press while it is waiting', () => {
    const onPress = vi.fn();
    render(<ResendLink request={idle} onPress={onPress} {...words} />);

    fireEvent.click(screen.getByRole('button', { name: 'Send a new code in 0:30' }));
    pass(29_000);
    fireEvent.click(screen.getByRole('button', { name: 'Send a new code in 0:01' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('turns back into a link when the wait is over, sends on a press, and waits again', () => {
    const onPress = vi.fn();
    render(<ResendLink request={idle} onPress={onPress} {...words} />);
    pass(30_000);

    const link = screen.getByRole('button', { name: 'Send a new code' });
    expect(link).not.toHaveAttribute('aria-disabled');
    fireEvent.click(link);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Send a new code in 0:30' })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Send a new code in 0:30' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('says so while the new code is being sent', () => {
    render(<ResendLink request={{ ...idle, isPending: true }} onPress={vi.fn()} {...words} />);

    expect(screen.getByRole('button', { name: /Sending…/ })).toBeInTheDocument();
  });
});
