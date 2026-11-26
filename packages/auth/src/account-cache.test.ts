import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { ACCOUNTS_KEY, forgetAccountData, keepAccountDataFor, refreshAccounts } from './account-cache';

const setup = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(ACCOUNTS_KEY, ['h-0']);
  queryClient.setQueryData(['tenant', 't-1'], { id: 't-1' });
  return queryClient;
};

describe('keepAccountDataFor', () => {
  it('keeps what was loaded on the first call and on repeats for the same account', () => {
    const queryClient = setup();
    expect(keepAccountDataFor(queryClient, 'h-0')).toBe(false);
    expect(keepAccountDataFor(queryClient, 'h-0')).toBe(false);
    expect(queryClient.getQueryData(['tenant', 't-1'])).toEqual({ id: 't-1' });
  });

  it('drops another account’s data, but not the accounts list, when the account changes', () => {
    const queryClient = setup();
    keepAccountDataFor(queryClient, 'h-0');
    expect(keepAccountDataFor(queryClient, 'h-1')).toBe(true);
    expect(queryClient.getQueryData(['tenant', 't-1'])).toBeUndefined();
    expect(queryClient.getQueryData(ACCOUNTS_KEY)).toEqual(['h-0']);
  });

  it('ignores a tab with no account, and starts afresh after the data was forgotten', () => {
    const queryClient = setup();
    keepAccountDataFor(queryClient, 'h-0');
    expect(keepAccountDataFor(queryClient, null)).toBe(false);
    forgetAccountData(queryClient);
    queryClient.setQueryData(['tenant', 't-1'], { id: 't-1' });
    expect(keepAccountDataFor(queryClient, 'h-1')).toBe(false);
    expect(queryClient.getQueryData(['tenant', 't-1'])).toEqual({ id: 't-1' });
  });
});

describe('forgetAccountData', () => {
  it('drops everything but the accounts list, and reads the list again', () => {
    const queryClient = setup();
    forgetAccountData(queryClient);
    expect(queryClient.getQueryData(['tenant', 't-1'])).toBeUndefined();
    expect(queryClient.getQueryData(ACCOUNTS_KEY)).toEqual(['h-0']);
    expect(queryClient.getQueryState(ACCOUNTS_KEY)?.isInvalidated).toBe(true);
  });
});

describe('refreshAccounts', () => {
  it('lets a read of the list already under way answer, rather than cancelling and repeating it', async () => {
    const queryClient = setup();
    const list = vi.fn(({ signal }: { signal: AbortSignal }) => new Promise<string[]>((resolve) => setTimeout(() => resolve(signal.aborted ? [] : ['h-0', 'h-1']), 0)));
    const observer = new QueryObserver(queryClient, { queryKey: ACCOUNTS_KEY, queryFn: list, staleTime: 0 });
    const stop = observer.subscribe(() => undefined);
    await refreshAccounts(queryClient);
    expect(list).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(ACCOUNTS_KEY)).toEqual(['h-0', 'h-1']);
    stop();
  });
});
