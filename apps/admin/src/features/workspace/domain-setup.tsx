import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isApiError } from '@yahel/api-client';
import type { WorkspaceDomain } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { AdminMark, ConsolePlaceholder, FlowButton, FlowIcon, FlowLink, FlowNotice, FlowShell, FlowStep, FlowWaiting, SetupRail, SetupStepList, StatusTag } from '@yahel/ui';
import type { SetupStepState } from '@yahel/ui';
import { useState } from 'react';
import { useTheme } from '../../theme';
import { needsRecord, recordOf } from './domain-record';
import { failureOf } from './feedback';
import { setupMessages as m } from './messages';
import { domainsQuery } from './queries';
import { RecordValue } from './record-copy';

export const setupSteps = ['intro', 'record', 'mail', 'protect'] as const;
export type SetupStep = (typeof setupSteps)[number];

export interface SetupLinks {
  helpUrl: string | null;
  privacyUrl: string | null;
  termsUrl: string | null;
}

export interface DomainSetupProps {
  session: Session;
  tenantId: string;
  slot: string;
  step: SetupStep;
  /** The domain to set up; unset, the primary one if it still needs verifying, else the first that does. */
  domainId?: string;
  links: SetupLinks;
}

/** Which domain setup is about. */
export function setupDomainOf(domains: readonly WorkspaceDomain[], domainId?: string) {
  const chosen = domainId ? domains.find((domain) => domain._id === domainId) : undefined;
  if (chosen) return chosen;
  const primary = domains.find((domain) => domain.isPrimary);
  if (primary && needsRecord(primary)) return primary;
  return domains.find(needsRecord) ?? primary ?? domains[0] ?? null;
}

type Check = { state: 'idle' } | { state: 'not-found'; at: Date } | { state: 'failed'; problem: string };

const timeOf = (date: Date) => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);

/**
 * Setting up a domain, full screen and outside the console: verify ownership by adding a DNS record and
 * checking it, as the design draws the manual path. Detecting the host, connecting to it, switching on mail
 * and protecting mail are not offered by the API yet, so those steps say they come in a later version.
 */
export function DomainSetup({ session, tenantId, slot, step, domainId, links }: DomainSetupProps) {
  const queryClient = useQueryClient();
  const { theme, toggle } = useTheme();
  const domains = useQuery(domainsQuery(session, tenantId));
  const [check, setCheck] = useState<Check>({ state: 'idle' });
  const domain = domains.data ? setupDomainOf(domains.data, domainId) : null;
  const home = `/u/${slot}/`;
  const at = (next: SetupStep) => `/u/${slot}/setup?step=${next}${domainId ? `&domain=${encodeURIComponent(domainId)}` : ''}`;

  const verify = useMutation({
    mutationFn: (id: string) => session.api.tenants.domains.verify(tenantId, id),
    onMutate: () => setCheck({ state: 'idle' }),
    onError: (error) => {
      if (isApiError(error) && error.code === 'DOMAIN_NOT_VERIFIED') setCheck({ state: 'not-found', at: new Date() });
      else setCheck({ state: 'failed', problem: failureOf(error, 'verify', domain?.domain ?? '') });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: domainsQuery(session, tenantId).queryKey }),
  });

  const verified = domain?.status === 'verified' || verify.isSuccess;
  const screen = step === 'mail' || step === 'protect' ? step : !domain ? 'none' : verified ? 'verified' : verify.isPending ? 'checking' : check.state === 'not-found' ? 'not-found' : step;
  const railState = (which: 'verify' | 'mail' | 'protect'): SetupStepState => {
    if (which === 'verify') return verified ? 'done' : screen === 'mail' || screen === 'protect' ? 'next' : 'now';
    return screen === which ? 'now' : 'next';
  };

  let body;
  if (domains.isPending) {
    body = <FlowWaiting title={m.loading}>{m.checkingTime}</FlowWaiting>;
  } else if (domains.isError) {
    body = (
      <FlowNotice tone="danger" actions={<FlowButton onPress={() => void domains.refetch()}>{m.tryAgain}</FlowButton>}>
        {m.failed}
      </FlowNotice>
    );
  } else if (screen === 'none' || !domain) {
    body = (
      <FlowStep key="none">
        <FlowStep.Intro>
          <FlowStep.Heading>{m.noDomain}</FlowStep.Heading>
          <FlowStep.Lede>{m.noDomainLede}</FlowStep.Lede>
        </FlowStep.Intro>
        <FlowStep.Actions>
          <FlowLink href={`/u/${slot}/domains`} variant="primary">
            {m.toDomains}
          </FlowLink>
        </FlowStep.Actions>
      </FlowStep>
    );
  } else {
    body = <Screen screen={screen} domain={domain} check={check} home={home} at={at} onCheck={() => verify.mutate(domain._id)} onShowRecords={() => setCheck({ state: 'idle' })} />;
  }

  return (
    <FlowShell skipLabel={m.context}>
      <FlowShell.Header
        brand={
          <FlowShell.BrandLink href={home} label={m.exit}>
            <AdminMark label={m.brand} word={m.word} product={m.product} context={m.context} />
          </FlowShell.BrandLink>
        }
      >
        <FlowButton variant="round" aria-label={theme === 'dark' ? m.switchToLight : m.switchToDark} onPress={toggle}>
          <FlowIcon name={theme === 'dark' ? 'sun' : 'moon'} />
        </FlowButton>
        <FlowLink href={home} variant="quiet">
          {m.exit}
        </FlowLink>
      </FlowShell.Header>
      <SetupRail
        label={m.rail}
        doneLabel={m.done}
        nowLabel={m.now}
        steps={[
          { label: m.steps.verify, state: railState('verify') },
          { label: m.steps.mail, state: railState('mail') },
          { label: m.steps.protect, state: railState('protect') },
        ]}
      />
      <FlowShell.Main>
        <FlowShell.Question>{body}</FlowShell.Question>
      </FlowShell.Main>
      <FlowShell.Footer dataLocation={m.dataLocation}>
        {links.helpUrl ? <FlowShell.FooterLink href={links.helpUrl}>{m.help}</FlowShell.FooterLink> : null}
        {links.privacyUrl ? <FlowShell.FooterLink href={links.privacyUrl}>{m.privacy}</FlowShell.FooterLink> : null}
        {links.termsUrl ? <FlowShell.FooterLink href={links.termsUrl}>{m.terms}</FlowShell.FooterLink> : null}
      </FlowShell.Footer>
    </FlowShell>
  );
}

interface ScreenProps {
  screen: SetupStep | 'checking' | 'not-found' | 'verified';
  domain: WorkspaceDomain;
  check: Check;
  home: string;
  at: (step: SetupStep) => string;
  onCheck: () => void;
  onShowRecords: () => void;
}

function Screen({ screen, domain, check, home, at, onCheck, onShowRecords }: ScreenProps) {
  const name = domain.domain;
  const record = recordOf(domain);
  switch (screen) {
    case 'intro':
      return (
        <FlowStep key="intro">
          <FlowStep.Intro>
            <FlowStep.Heading>{m.introTitle(name)}</FlowStep.Heading>
            <FlowStep.Lede>{m.introLede}</FlowStep.Lede>
          </FlowStep.Intro>
          <SetupStepList steps={m.introSteps(name)} />
          <FlowStep.Actions>
            <FlowLink href={at('record')} variant="primary">
              {m.getStarted}
            </FlowLink>
            <FlowLink href={home} variant="quiet">
              {m.doLater}
            </FlowLink>
          </FlowStep.Actions>
        </FlowStep>
      );
    case 'record':
      return (
        <FlowStep key="record">
          <FlowStep.Intro>
            <FlowStep.Heading>{m.recordTitle}</FlowStep.Heading>
            <FlowStep.Lede>{m.recordLede(name)}</FlowStep.Lede>
          </FlowStep.Intro>
          {check.state === 'failed' ? <FlowNotice tone="danger">{check.problem}</FlowNotice> : null}
          {record.value ? (
            <section className="setup-record" aria-label={m.recordCard}>
              <p className="setup-record__head">
                {m.recordCard}
                <StatusTag tone="info" icon="key">
                  {record.type}
                </StatusTag>
              </p>
              <dl className="setup-record__rows">
                <div className="setup-record__row">
                  <dt>{m.type}</dt>
                  <dd>
                    <code translate="no">{record.type}</code>
                  </dd>
                </div>
                <RecordValue label={m.host} value={record.host ?? '@'} />
                <RecordValue label={record.type === 'CNAME' ? m.pointsTo : m.value} value={record.value} />
              </dl>
              <p className="ws-console-note">{m.ttl}</p>
            </section>
          ) : (
            <FlowNotice tone="warning">{m.noValue}</FlowNotice>
          )}
          <p className="ws-console-note">{m.hostTip}</p>
          {record.type === 'TXT' ? <p className="ws-console-note">{m.cnameLater}</p> : null}
          <FlowStep.Actions>
            <FlowButton variant="primary" onPress={onCheck} isDisabled={!record.value}>
              {m.check}
            </FlowButton>
          </FlowStep.Actions>
        </FlowStep>
      );
    case 'checking':
      return (
        <FlowStep key="checking">
          <FlowStep.Intro>
            <FlowStep.Heading>{m.checkingTitle(name)}</FlowStep.Heading>
            <FlowStep.Lede>{m.checkingLede}</FlowStep.Lede>
          </FlowStep.Intro>
          <FlowWaiting title={m.checkingWhat(record.type)}>{m.checkingTime}</FlowWaiting>
        </FlowStep>
      );
    case 'not-found':
      return (
        <FlowStep key="not-found">
          <FlowStep.Intro>
            <FlowStep.Heading>{m.notFoundTitle}</FlowStep.Heading>
            <FlowStep.Lede>{m.notFoundLede}</FlowStep.Lede>
          </FlowStep.Intro>
          <ul className="setup-causes" aria-label={m.causes}>
            {m.notFoundCauses(name).map((cause) => (
              <li key={cause}>{cause}</li>
            ))}
          </ul>
          {check.state === 'not-found' ? <p className="ws-console-note">{m.lastChecked(timeOf(check.at))}</p> : null}
          <FlowStep.Actions>
            <FlowButton variant="primary" onPress={onCheck}>
              {m.checkAgain}
            </FlowButton>
            <FlowButton variant="quiet" onPress={onShowRecords}>
              {m.showRecords}
            </FlowButton>
          </FlowStep.Actions>
        </FlowStep>
      );
    case 'verified':
      return (
        <FlowStep key="verified">
          <FlowStep.Intro>
            <FlowStep.Heading>{m.verifiedTitle(name)}</FlowStep.Heading>
            <FlowStep.Lede>{m.verifiedLede(name)}</FlowStep.Lede>
          </FlowStep.Intro>
          <SetupStepList steps={m.introSteps(name).map((item, index) => (index === 0 ? { ...item, time: m.stepDone, done: true } : item))} />
          <FlowStep.Actions>
            <FlowLink href={at('mail')} variant="primary">
              {m.switchOnMail}
            </FlowLink>
            <FlowLink href={home} variant="quiet">
              {m.doLater}
            </FlowLink>
          </FlowStep.Actions>
        </FlowStep>
      );
    case 'mail':
    case 'protect':
      return (
        <FlowStep key={screen}>
          <FlowStep.Intro>
            <FlowStep.Heading>{screen === 'mail' ? m.mailTitle : m.protectTitle}</FlowStep.Heading>
          </FlowStep.Intro>
          <ConsolePlaceholder
            title={m.later}
            action={
              <FlowLink href={home} variant="quiet">
                {m.backToConsole}
              </FlowLink>
            }
          >
            {screen === 'mail' ? m.mailBody(name) : m.protectBody}
          </ConsolePlaceholder>
        </FlowStep>
      );
  }
}
