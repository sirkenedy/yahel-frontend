import { FlowButton, FlowNotice, FlowStep } from '@yahel/ui';
import { businessMessages as m } from '../messages';

/** The plan could not be shown: its name and price come from the server, and nothing here invents them. */
export function PricingUnavailable({ status, onRetry }: { status: 'loading' | 'failed'; onRetry: () => void }) {
  return status === 'loading' ? (
    <FlowStep.Note>{m.planLoading}</FlowStep.Note>
  ) : (
    <FlowNotice
      tone="danger"
      title={m.planUnavailableTitle}
      actions={
        <FlowButton variant="chip" onPress={onRetry}>
          {m.tryAgain}
        </FlowButton>
      }
    >
      {m.planUnavailable}
    </FlowNotice>
  );
}
