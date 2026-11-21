import { FlowLink, FlowStep, SuccessMark } from '@yahel/ui';
import { stepPath } from '../machine';
import { signInMessages as m } from '../messages';
import { StepFrame } from './step-frame';

export function HelpSentStep() {
  return (
    <StepFrame title={m.helpSentTitle} lede={m.helpSentLede}>
      <FlowStep.Body>
        <SuccessMark />
      </FlowStep.Body>
      <FlowStep.Actions>
        <FlowLink variant="primary" href={stepPath('email')}>
          {m.backToSignIn}
        </FlowLink>
      </FlowStep.Actions>
    </StepFrame>
  );
}
