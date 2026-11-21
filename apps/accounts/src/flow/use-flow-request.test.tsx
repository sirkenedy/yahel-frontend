import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@yahel/api-client';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useFlowRequest } from './use-flow-request';

const deferred = <Value,>() => {
  let resolve!: (value: Value) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Value>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const describeFailure = (error: unknown) => (error instanceof ApiError && error.status === 401 ? 'Wrong password.' : 'Something went wrong.');

const setup = (run: (input: string) => Promise<string>, callbacks: { onDone?: (outcome: string) => void; onFailed?: (error: unknown) => void } = {}) => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const hook = renderHook(({ visit }) => useFlowRequest<string, string>({ visit, describe: describeFailure, run, ...callbacks }), { wrapper, initialProps: { visit: 1 } });
  return { ...hook, queryClient };
};

describe('useFlowRequest', () => {
  it('runs once for two starts that arrive together, and again after the first settles', async () => {
    const run = vi.fn().mockResolvedValue('signed-in');
    const { result } = setup(run);

    let accepted: boolean[] = [];
    act(() => {
      accepted = [result.current.start('secret'), result.current.start('secret')];
    });
    expect(accepted).toEqual([true, false]);
    await waitFor(() => expect(result.current.outcome).toBe('signed-in'));
    expect(run).toHaveBeenCalledTimes(1);

    act(() => void result.current.start('secret'));
    await waitFor(() => expect(run).toHaveBeenCalledTimes(2));
  });

  it('can be started again after the step was left while it was running', async () => {
    const first = deferred<string>();
    const run = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue('signed-in');
    const onDone = vi.fn();
    const { result, rerender } = setup(run, { onDone });

    act(() => void result.current.start('secret'));
    await waitFor(() => expect(result.current.isPending).toBe(true));
    rerender({ visit: 2 });
    rerender({ visit: 3 });
    expect(result.current.isPending).toBe(true);
    act(() => expect(result.current.start('again')).toBe(false));

    await act(async () => first.reject(new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'x' })));
    await waitFor(() => expect(result.current.isPending).toBe(false));
    // The failure happened while the person was elsewhere, so it is not shown on their return.
    expect(result.current.failure).toBeNull();

    act(() => expect(result.current.start('again')).toBe(true));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('signed-in', undefined, undefined, expect.anything()));
    expect(run).toHaveBeenLastCalledWith('again');
  });

  it('shows a failure during the visit it happened in and not after the step is left and revisited', async () => {
    const run = vi.fn().mockRejectedValue(new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'x' }));
    const onFailed = vi.fn();
    const { result, rerender } = setup(run, { onFailed });

    act(() => void result.current.start('wrong'));
    await waitFor(() => expect(result.current.failure).toBe('Wrong password.'));
    expect(onFailed).toHaveBeenCalledTimes(1);

    rerender({ visit: 2 });
    expect(result.current.failure).toBeNull();
  });

  it('keeps showing a flow-scoped result on the step that follows', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result, rerender } = renderHook(({ visit }) => useFlowRequest({ visit, scope: 'flow', describe: describeFailure, run: async () => 'cancelled' as const }), { wrapper, initialProps: { visit: 1 } });

    act(() => void result.current.start());
    rerender({ visit: 2 });

    await waitFor(() => expect(result.current.outcome).toBe('cancelled'));
  });

  it('never leaves its input in the query client', async () => {
    const pending = deferred<string>();
    const { result, queryClient } = setup(() => pending.promise);
    const held = () => JSON.stringify(queryClient.getMutationCache().getAll().map((mutation) => mutation.state));

    act(() => void result.current.start('correct horse battery staple'));
    await waitFor(() => expect(result.current.isPending).toBe(true));
    expect(held()).not.toContain('correct horse');

    await act(async () => pending.resolve('signed-in'));
    expect(held()).not.toContain('correct horse');
  });
});
