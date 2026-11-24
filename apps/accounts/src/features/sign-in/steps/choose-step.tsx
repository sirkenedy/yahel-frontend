import { AccountList, FlowButton, FlowNotice, FlowStep, FlowWaiting } from '@yahel/ui';
import type { ClientAccount } from '@yahel/api-client';
import { useEffect, useRef } from 'react';
import { kindOf, nameOf, statusOf } from '../../../flow/accounts';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

export function ChooseStep() {
  const { state, actions, meta } = useSignInFlow();
  const { removing, accounts } = state;
  const { removeAccount, switchAccount } = meta.requests;
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const anotherAccount = useRef<HTMLButtonElement>(null);
  // Where focus should go once the row being removed has left the list: the row that takes its place.
  const focusAfterRemoval = useRef<{ removed: string; next: string | null } | null>(null);

  const remove = (account: ClientAccount, index: number) => {
    const neighbour = accounts[index + 1] ?? accounts[index - 1];
    focusAfterRemoval.current = { removed: account.handle, next: neighbour?.handle ?? null };
    actions.removeAccount(account);
  };

  // The Remove button that had focus disappears with its row; without this, focus would fall to the page.
  useEffect(() => {
    const pending = focusAfterRemoval.current;
    if (!pending || accounts.some((account) => account.handle === pending.removed)) return;
    focusAfterRemoval.current = null;
    ((pending.next ? removeButtons.current.get(pending.next) : null) ?? anotherAccount.current)?.focus();
  }, [accounts]);

  return (
    <StepFrame title={m.chooseTitle} lede={m.chooseLede} requests={[removeAccount, switchAccount]} next={{ retry: null }}>
      <FlowStep.Body>
        {state.accountsStatus === 'pending' ? <FlowWaiting title={m.accountsLoading}>{null}</FlowWaiting> : null}
        {state.accountsStatus === 'error' ? (
          <FlowNotice
            tone="danger"
            title={m.accountsFailedTitle}
            actions={
              <FlowButton variant="chip" onPress={actions.reloadAccounts}>
                {m.tryAgain}
              </FlowButton>
            }
          >
            {m.accountsFailed}
          </FlowNotice>
        ) : null}
        <AccountList label={m.accountsLabel}>
          {accounts.map((account, index) => (
            <AccountList.Account
              key={account.handle}
              name={nameOf(account)}
              email={account.email}
              kind={kindOf(account)}
              initials={account.initials}
              avatarUrl={account.avatarUrl}
              presence={account.signedIn ? 'signed-in' : 'signed-out'}
              detail={statusOf(account, m)}
              actionPrefix={account.signedIn ? m.switchTo : m.signInTo}
              onPress={() => actions.chooseAccount(account)}
              isDisabled={removing || switchAccount.isPending}
            >
              {removing ? (
                <FlowButton
                  ref={(button) => {
                    if (button) removeButtons.current.set(account.handle, button);
                    else removeButtons.current.delete(account.handle);
                  }}
                  variant="destructive"
                  aria-label={m.removeLabel(account.email)}
                  onPress={() => remove(account, index)}
                  isDisabled={removeAccount.isPending}
                >
                  {m.remove}
                </FlowButton>
              ) : null}
            </AccountList.Account>
          ))}
          <AccountList.Action ref={anotherAccount} onPress={actions.useAnotherAccount}>
            {m.useAnother}
          </AccountList.Action>
        </AccountList>
      </FlowStep.Body>
      {accounts.length > 0 ? (
        <FlowStep.Links>
          <FlowButton variant="link" onPress={() => actions.setRemoving(!removing)}>
            {removing ? m.removeDone : m.removeAnAccount}
          </FlowButton>
        </FlowStep.Links>
      ) : null}
    </StepFrame>
  );
}
