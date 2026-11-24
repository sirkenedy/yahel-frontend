import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@yahel/auth';
import { useEffect } from 'react';
import { forgetAccountData, refreshAccounts } from '../../flow/accounts';
import { say } from '../../flow/toasts';
import { chromeMessages as m } from './messages';

/**
 * Keeps this tab in step with the others and with the server: the chooser's list is read again when
 * accounts change elsewhere, and when this tab's own account is signed out or its slot passes to another
 * account, what it cached is dropped and the guards decide again where the person belongs.
 */
export function useSessionEvents(session: Pick<Session, 'subscribe'>, recheck: () => void) {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      session.subscribe((event) => {
        if (event.type === 'accounts-changed') {
          void refreshAccounts(queryClient);
          return;
        }
        forgetAccountData(queryClient);
        if (event.type === 'changed-hands') say(m.accountChanged, 'info');
        recheck();
      }),
    [session, queryClient, recheck],
  );
}
