import { AccountList, FlowButton, FlowNotice, FlowStep } from '@yahel/ui';
import { useState } from 'react';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

export function ChooseStep() {
  const { state, actions, meta } = useSignInFlow();
  const [removing, setRemoving] = useState(false);
  const { removeAccount } = meta.requests;

  return (
    <StepFrame title={m.chooseTitle} lede={m.chooseLede} failure={removeAccount.failure}>
      <FlowStep.Body>
        <AccountList label={m.accountsLabel}>
          {state.accounts.map((account) => (
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
                <FlowButton variant="destructive" aria-label={m.removeLabel(account.email)} onPress={() => actions.removeAccount(account.email)} isDisabled={removeAccount.isPending}>
                  {m.remove}
                </FlowButton>
              ) : null}
            </AccountList.Account>
          ))}
          <AccountList.Action onPress={actions.useAnotherAccount}>{m.useAnother}</AccountList.Action>
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
