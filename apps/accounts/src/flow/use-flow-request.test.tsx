import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@yahel/api-client';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Feedback } from './feedback';
import { requestStatus, useFlowRequest } from './use-flow-request';
import type { RequestVisit } from './use-flow-request';

const deferred = <Value,>() => {
  let resolve!: (value: Value) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Value>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const describeFailure = (error: unknown): Feedback => (error instanceof ApiError && error.status === 401 ? { place: 'field', field: 'password', text: 'Wrong password.' } : { place: 'banner', tone: 'danger', text: 'Something went wrong.' });

const setup = (run: (input: string, during: RequestVisit) => Promise<string>, callbacks: { onDone?: (outcome: string) => void; onFailed?: (error: unknown) => void } = {}) => {
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
    expect(result.current.feedback).toBeNull();

    act(() => expect(result.current.start('again')).toBe(true));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('signed-in', undefined, undefined, expect.anything()));
    expect(run).toHaveBeenLastCalledWith('again', expect.objectContaining({ isCurrent: expect.any(Function) }));
  });

  it('shows a failure during the visit it happened in and not after the step is left and revisited', async () => {
    const run = vi.fn().mockRejectedValue(new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'x' }));
    const onFailed = vi.fn();
    const { result, rerender } = setup(run, { onFailed });

    act(() => void result.current.start('wrong'));
    await waitFor(() => expect(result.current.feedback).toEqual({ place: 'field', field: 'password', text: 'Wrong password.' }));
    expect(onFailed).toHaveBeenCalledTimes(1);

    rerender({ visit: 2 });
    expect(result.current.feedback).toBeNull();
  });

  it('keeps one description of a failure across renders, puts it away when asked, and drops it when started again', async () => {
    const second = deferred<string>();
    const run = vi.fn().mockRejectedValueOnce(new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'x' })).mockReturnValue(second.promise);
    const { result, rerender } = setup(run);

    act(() => void result.current.start('first'));
    await waitFor(() => expect(result.current.feedback).toMatchObject({ place: 'banner', text: 'Something went wrong.' }));
    const told = result.current.feedback;
    rerender({ visit: 1 });
    expect(result.current.feedback).toBe(told);

    act(() => result.current.clear());
    expect(result.current.feedback).toBeNull();

    const failing = vi.fn().mockRejectedValueOnce(new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'x' })).mockReturnValue(second.promise);
    const next = setup(failing);
    act(() => void next.result.current.start('wrong'));
    await waitFor(() => expect(next.result.current.feedback).not.toBeNull());
    act(() => void next.result.current.start('again'));
    expect(next.result.current.feedback).toBeNull();
    await act(async () => second.resolve('signed-in'));
  });

  it('keeps showing a flow-scoped result on the step that follows', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result, rerender } = renderHook(({ visit }) => useFlowRequest({ visit, scope: 'flow', describe: describeFailure, run: async () => 'cancelled' as const }), { wrapper, initialProps: { visit: 1 } });

    act(() => void result.current.start());
    rerender({ visit: 2 });

    await waitFor(() => expect(result.current.outcome).toBe('cancelled'));
  });

  it('tells a running request whether the step it began on is still the one on screen', async () => {
    const pending = deferred<string>();
    const seen: boolean[] = [];
    const { result, rerender } = setup(async (_input, during) => {
      seen.push(during.isCurrent());
      await pending.promise;
      seen.push(during.isCurrent());
      return 'done';
    });

    act(() => void result.current.start('x'));
    await waitFor(() => expect(seen).toHaveLength(1));
    rerender({ visit: 2 });
    await act(async () => pending.resolve('go'));

    expect(seen).toEqual([true, false]);
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

describe('requestStatus', () => {
  const request = { isPending: true, feedback: null, clear: vi.fn(), start: vi.fn(), outcome: undefined };

  it('hands a step what it may know about a request, without the means to start it', () => {
    const status = requestStatus(request);

    expect(status).toEqual({ isPending: true, feedback: null, clear: request.clear });
    expect(status).not.toHaveProperty('start');
    expect(status).not.toHaveProperty('again');
  });

  it('offers to make the request again when it needs nothing typed', () => {
    const again = vi.fn().mockReturnValue(true);
    const status = requestStatus(request, again);

    expect(status.again?.()).toBeUndefined();
    expect(again).toHaveBeenCalledTimes(1);
  });
});
