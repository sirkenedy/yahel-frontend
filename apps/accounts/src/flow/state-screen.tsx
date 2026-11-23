import { useQuery } from '@tanstack/react-query';
import type { ServiceStatus } from '@yahel/api-client';
import { FlowButton, FlowLink, FlowNotice, FlowState } from '@yahel/ui';
import type { FlowIconName, FlowTone } from '@yahel/ui';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ScreenKind } from './feedback';
import { flowMessages as m } from './messages';

/** Where the ways out of a whole-screen state lead. A missing address leaves that action out. */
export interface StateExits {
  signIn: string;
  signUp?: string | null;
  resetPassword?: string | null;
  support?: string | null;
}

export interface StateScreenProps {
  kind: ScreenKind;
  /** Whose account it is about, when the flow knows. */
  account?: string | null;
  /** When the server says the wait is over. */
  retryAt?: number;
  exits: StateExits;
  /** Shows the step again. */
  onRetry: () => void;
  /** Says how long planned work will take, where something can. */
  serviceStatus?: ServiceStatus | null;
}

interface Drawn {
  tone: FlowTone;
  icon: FlowIconName;
  title: string;
  lede: string;
  note?: string | null;
  actions: ReactNode;
}

const link = (href: string | null | undefined, label: string, variant: 'primary' | 'quiet') =>
  href ? (
    <FlowLink key={label} href={href} variant={variant}>
      {label}
    </FlowLink>
  ) : null;

const again = (onRetry: () => void) => (
  <FlowButton variant="primary" onPress={onRetry}>
    {m.tryAgain}
  </FlowButton>
);

function draw({ kind, account = null, retryAt, exits, onRetry }: StateScreenProps, window: { from: string; until: string } | null): Drawn {
  const retryTime = retryAt ? m.timeOf(retryAt) : null;
  switch (kind) {
    case 'locked':
      return { tone: 'warning', icon: 'clock', title: m.lockedTitle, lede: m.lockedLede, note: retryTime ? m.lockedUntil(retryTime) : m.lockedNote, actions: [link(exits.resetPassword, m.resetPassword, 'primary'), link(exits.signIn, m.backToSignIn, exits.resetPassword ? 'quiet' : 'primary')] };
    case 'suspended':
      return { tone: 'danger', icon: 'pause', title: m.suspendedTitle, lede: m.suspendedLede(account), note: m.suspendedNote, actions: [link(exits.support, m.contactSupport, 'primary'), link(exits.signIn, m.useAnotherAccount, exits.support ? 'quiet' : 'primary')] };
    case 'org-paused':
      return { tone: 'warning', icon: 'building', title: m.pausedTitle, lede: m.pausedLede(account), note: m.pausedNote, actions: link(exits.signIn, m.useAnotherAccount, 'primary') };
    case 'link-expired':
    case 'link-used':
      return { tone: 'info', icon: 'unlink', title: kind === 'link-used' ? m.linkUsedTitle : m.linkExpiredTitle, lede: kind === 'link-used' ? m.linkUsedLede : m.linkExpiredLede, actions: [link(exits.signIn, m.signIn, 'primary'), link(exits.signUp, m.createAccount, 'quiet')] };
    case 'session-ended':
      return { tone: 'info', icon: 'clock', title: m.sessionEndedTitle, lede: m.sessionEndedLede, actions: link(exits.signIn, m.signInAgain, 'primary') };
    case 'signed-out-everywhere':
      return { tone: 'danger', icon: 'alert', title: m.signedOutTitle, lede: m.signedOutLede, note: m.signedOutNote, actions: link(exits.signIn, m.signInAgain, 'primary') };
    case 'maintenance': {
      const from = window ? m.timeOf(window.from) : null;
      const until = window ? m.timeOf(window.until) : null;
      return { tone: 'info', icon: 'wrench', title: m.maintenanceTitle, lede: m.maintenanceLede(until ?? retryTime), note: from && until ? m.maintenanceWindow(from, until) : null, actions: again(onRetry) };
    }
  }
}

/**
 * The whole-screen states a server answer can lead to, drawn in place of the step. Which one, and the
 * facts it shows, come from the feedback mapping; the words are the same in every flow.
 */
export function StateScreen(props: StateScreenProps) {
  const { kind, serviceStatus } = props;
  const window = useQuery({ queryKey: ['flow', 'service-window'], queryFn: () => serviceStatus?.window() ?? null, enabled: kind === 'maintenance' && Boolean(serviceStatus), staleTime: 60_000 }).data ?? null;
  const { tone, icon, title, lede, note, actions } = draw(props, window);

  useEffect(() => {
    document.title = m.pageTitle(title);
  }, [title]);

  return (
    <FlowState tone={tone} icon={icon} title={title} lede={lede} actions={actions}>
      {note ? <FlowNotice>{note}</FlowNotice> : null}
    </FlowState>
  );
}
