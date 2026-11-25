import { FlowLink, FlowNotice } from '@yahel/ui';
import { signInMessages as m } from '../messages';
import { useSignInFlow } from '../sign-in-flow';

/** At the top of the chooser and the email step when Admin sent the person: only an administrator account will do. */
export function AdminNotice() {
  const { state, meta } = useSignInFlow();
  if (!state.adminOnly) return null;
  const help = meta.screens.exits.support;
  return (
    <FlowNotice tone="info" title={m.adminNoticeTitle} actions={help ? <FlowLink href={help}>{m.adminLearnMore}</FlowLink> : undefined}>
      {m.adminNotice}
    </FlowNotice>
  );
}
