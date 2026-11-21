import { AccountList, FlowButton, FlowNotice, FlowStep } from '@yahel/ui';
import { useEffect, useRef, useState } from 'react';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

export function ChooseStep() {
  const { state, actions, meta } = useSignInFlow();
  const [removing, setRemoving] = useState(false);
  const { removeAccount } = meta.requests;
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const anotherAccount = useRef<HTMLButtonElement>(null);
  // Where focus should go once the row being removed has left the list: the row that takes its place.
  const focusAfterRemoval = useRef<{ removed: string; next: string | null } | null>(null);

  const remove = (email: string, index: number) => {
    const neighbour = state.accounts[index + 1] ?? state.accounts[index - 1];
    focusAfterRemoval.current = { removed: email, next: neighbour?.email ?? null };
    actions.removeAccount(email);
  };

  // The Remove button that had focus disappears with its row; without this, focus would fall to the page.
  useEffect(() => {
    const pending = focusAfterRemoval.current;
    if (!pending || state.accounts.some((account) => account.email === pending.removed)) return;
    focusAfterRemoval.current = null;
    ((pending.next ? removeButtons.current.get(pending.next) : null) ?? anotherAccount.current)?.focus();
  }, [state.accounts]);

  return (
    <StepFrame title={m.chooseTitle} lede={m.chooseLede} failure={removeAccount.failure}>
      <FlowStep.Body>
        <AccountList label={m.accountsLabel}>
          {state.accounts.map((account, index) => (
            <AccountList.Account
              key={account.email}
              name={account.name}
              email={account.email}
              kind={account.kind}
              detail={account.signedOut ? m.signedOut : (account.organisation ?? m.personal)}
              actionPrefix={m.continueAs}
              onPress={() => actions.chooseAccount(account.email)}
              isDisabled={removing}
            >
              {removing ? (
                <FlowButton
                  ref={(button) => {
                    if (button) removeButtons.current.set(account.email, button);
                    else removeButtons.current.delete(account.email);
                  }}
                  variant="destructive"
                  aria-label={m.removeLabel(account.email)}
                  onPress={() => remove(account.email, index)}
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
        {state.removedAccount ? <FlowNotice>{m.removed(state.removedAccount)}</FlowNotice> : null}
      </FlowStep.Body>
      <FlowStep.Links>
        <FlowButton variant="link" onPress={() => setRemoving(!removing)}>
          {removing ? m.removeDone : m.removeAnAccount}
        </FlowButton>
      </FlowStep.Links>
    </StepFrame>
  );
}
