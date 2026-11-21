import { FlowLink, FlowStep } from '@yahel/ui';
import { AppFrame } from './app-frame';
import { chromeMessages as m } from './messages';

const SIGN_IN = '/signin';

export function NotFound() {
  return (
    <AppFrame links={{ home: SIGN_IN, help: null, privacy: null, terms: null }}>
      <FlowStep>
        <FlowStep.Intro>
          <FlowStep.Heading>{m.notFoundTitle}</FlowStep.Heading>
          <FlowStep.Lede>{m.notFoundLede}</FlowStep.Lede>
        </FlowStep.Intro>
        <FlowStep.Actions>
          <FlowLink variant="primary" href={SIGN_IN}>
            {m.goToSignIn}
          </FlowLink>
        </FlowStep.Actions>
      </FlowStep>
    </AppFrame>
  );
}
