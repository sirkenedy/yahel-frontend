import { FlowButton, FlowNotice, FlowSelect } from '@yahel/ui';
import { flowMessages as m } from './messages';

/** A field whose choices come from the server, before they have: the field while loading, then what failed and Try again. */
export function ListUnavailable({ label, failed, onRetry }: { label: string; failed: boolean; onRetry: () => void }) {
  return failed ? (
    <FlowNotice
      tone="danger"
      title={label}
      actions={
        <FlowButton variant="chip" onPress={onRetry}>
          {m.tryAgain}
        </FlowButton>
      }
    >
      {m.listFailed}
    </FlowNotice>
  ) : (
    <FlowSelect label={label} value="" onChange={() => undefined}>
      <option value="">{m.listLoading}</option>
    </FlowSelect>
  );
}
