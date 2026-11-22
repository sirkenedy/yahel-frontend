import { FlowButton } from '@yahel/ui';
import { useState } from 'react';
import { flowMessages as m } from './messages';
import type { FlowRequest } from './use-flow-request';
import { useSecondsLeft } from './use-waits';

const COOL_DOWN = 30_000;

export interface ResendLinkProps {
  request: FlowRequest;
  onPress: () => void;
  /** "Send a new code". */
  label: string;
  /** The same with the time left: "Send a new code in 0:24". */
  waitLabel: (clock: string) => string;
  pendingLabel: string;
}

/**
 * "Send a new code", which can be pressed again only after a pause: a code has just been sent when the
 * step appears, and each press sends another. While waiting it says how long, in the control itself.
 */
export function ResendLink({ request, onPress, label, waitLabel, pendingLabel }: ResendLinkProps) {
  const [readyAt, setReadyAt] = useState(() => Date.now() + COOL_DOWN);
  const left = useSecondsLeft(readyAt);
  const press = () => {
    if (left > 0) return;
    setReadyAt(Date.now() + COOL_DOWN);
    onPress();
  };

  return (
    <FlowButton variant="link" onPress={press} aria-disabled={left > 0 || undefined} isPending={request.isPending} pendingLabel={pendingLabel}>
      {left > 0 ? waitLabel(m.clock(left)) : label}
    </FlowButton>
  );
}
