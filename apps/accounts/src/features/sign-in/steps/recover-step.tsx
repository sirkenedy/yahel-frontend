import type { RecoveryMethod } from '@yahel/api-client';
import { Choice, ChoiceGroup, FlowButton, FlowIcon, FlowLink, FlowNotice, FlowStep } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { stepPath } from '../machine';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';
import { StepFrame } from './step-frame';

const describeOption = { phone: m.recoverByPhone, email: m.recoverByEmail } as const;
const iconFor = { phone: 'phone', email: 'mail' } as const;

export function RecoverStep() {
  const { state, actions, meta } = useSignInFlow();
  const options = state.recoveryOptions;
  const [picked, setPicked] = useState<RecoveryMethod | null>(null);
  const method = picked ?? options?.[0]?.method ?? null;
  const { sendResetCode: request, recoveryOptions: loading } = meta.requests;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (method) actions.sendResetCode(method);
  };

  return (
    <StepFrame title={m.recoverTitle} lede={m.recoverLede} requests={[request, loading]}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          {options && method ? (
            <ChoiceGroup label={m.recoverMethods} value={method} onChange={setPicked} isDisabled={request.isPending}>
              {options.map((option) => (
                <Choice key={option.method} value={option.method} icon={<FlowIcon name={iconFor[option.method]} />}>
                  {describeOption[option.method](option.destination)}
                </Choice>
              ))}
            </ChoiceGroup>
          ) : loading.feedback ? null : (
            <FlowNotice>{m.recoverLoading}</FlowNotice>
          )}
          <FlowNotice>{m.recoverPromise}</FlowNotice>
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary" isPending={request.isPending} pendingLabel={m.sendingCode} isDisabled={!method}>
            {m.sendCode}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
      {meta.offers.help ? (
        <FlowStep.Links>
          <FlowLink href={stepPath('help')}>{options && options.length > 1 ? m.cantUseThese : m.cantUseThis}</FlowLink>
        </FlowStep.Links>
      ) : null}
    </StepFrame>
  );
}
