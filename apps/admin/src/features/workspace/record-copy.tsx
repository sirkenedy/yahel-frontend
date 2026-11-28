import { FlowButton } from '@yahel/ui';
import { useState } from 'react';
import { setupMessages as m } from './messages';

/** One value of a DNS record, with a button that copies it and says whether that worked. */
export function RecordValue({ label, value, shown }: { label: string; value: string; shown?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copy = () => {
    if (!navigator.clipboard) return setState('failed');
    navigator.clipboard.writeText(value).then(
      () => setState('copied'),
      () => setState('failed'),
    );
  };
  return (
    <div className="setup-record__row">
      <dt>{label}</dt>
      <dd>
        <code translate="no">{shown ?? value}</code>
        <FlowButton variant="chip" aria-label={m.copyWhat(label)} onPress={copy}>
          {state === 'copied' ? m.copied : m.copy}
        </FlowButton>
        <span role="status" className={state === 'failed' ? 'ws-console-note' : 'ws-flow-hidden'}>
          {state === 'failed' ? m.copyFailed : state === 'copied' ? m.copied : ''}
        </span>
      </dd>
    </div>
  );
}
