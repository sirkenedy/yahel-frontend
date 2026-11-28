import { useQuery } from '@tanstack/react-query';
import type { Session } from '@yahel/auth';
import { ConsoleCard, ConsoleFacts, ConsolePage, FlowButton, FlowIcon, FlowLink, FlowNotice, StatusTag } from '@yahel/ui';
import { useStore } from 'zustand';
import { needsRecord } from './domain-record';
import { homeMessages as m } from './messages';
import { domainsQuery, peopleCountQuery, workspaceQuery } from './queries';

export interface HomePageProps {
  session: Session;
  tenantId: string;
  /** The workspace's name from the session's context, shown until the workspace itself answers. */
  name: string;
  slot: string;
}

type StepState = 'done' | 'now' | 'later';

/** Admin's home: the next step, the setup checklist, and a card each for users, the domain, billing and security. */
export function HomePage({ session, tenantId, name, slot }: HomePageProps) {
  const me = useStore(session.store, (state) => state.profile);
  const workspace = useQuery(workspaceQuery(session, tenantId));
  const domains = useQuery(domainsQuery(session, tenantId));
  const people = useQuery(peopleCountQuery(session, tenantId));
  const organisation = workspace.data?.displayName || name;
  const primary = domains.data?.find((domain) => domain.isPrimary) ?? domains.data?.[0] ?? null;
  const shown = primary?.domain ?? m.yourDomain;
  const verified = primary?.status === 'verified';
  const unverified = domains.data?.find(needsRecord);
  const setupHref = `/u/${slot}/setup`;
  const firstName = me?.firstName?.trim();

  const steps: { key: string; title: string; detail: string; state: StepState; action?: { href: string; label: string } }[] = [
    { key: 'account', title: m.steps.account.title, detail: m.steps.account.detail, state: 'done' },
    { key: 'verify', title: m.steps.verify.title, detail: m.steps.verify.detail(shown), state: verified ? 'done' : 'now', action: verified ? undefined : primary ? { href: setupHref, label: m.verify } : { href: `/u/${slot}/domains`, label: m.addDomainAction } },
    { key: 'mail', title: m.steps.mail.title, detail: m.steps.mail.detail(shown), state: primary?.mxConfigured ? 'done' : 'later' },
    { key: 'team', title: m.steps.team.title, detail: m.steps.team.detail(people.data?.length ?? 1), state: 'later' },
    { key: 'protect', title: m.steps.protect.title, detail: m.steps.protect.detail, state: 'later' },
  ];
  const done = steps.filter((step) => step.state === 'done').length;

  return (
    <ConsolePage
      leading={
        <span className="home-mark" aria-hidden="true">
          {organisation.trim()[0]?.toUpperCase()}
        </span>
      }
      title={firstName ? m.welcome(firstName) : m.welcomeBack}
      lede={m.subtitle(organisation, primary?.domain ?? null)}
    >
      {domains.isPending ? (
        <div role="status" aria-label={m.loading} className="ws-skeleton console__placeholder" />
      ) : domains.isError ? (
        <FlowNotice
          tone="danger"
          actions={
            <FlowButton
              onPress={() => {
                void domains.refetch();
                void workspace.refetch();
              }}
            >
              {m.tryAgain}
            </FlowButton>
          }
        >
          {m.failed}
        </FlowNotice>
      ) : (
        <>
          {unverified ? (
            <FlowNotice
              title={m.verifyTitle(unverified.domain)}
              actions={
                <FlowLink href={unverified === primary ? setupHref : `${setupHref}?domain=${encodeURIComponent(unverified._id)}`} variant="primary">
                  {m.verifyAction}
                </FlowLink>
              }
            >
              {m.verifyText(unverified.domain)}
            </FlowNotice>
          ) : !primary ? (
            <FlowNotice
              title={m.addDomainTitle}
              actions={
                <FlowLink href={`/u/${slot}/domains`} variant="primary">
                  {m.addDomainAction}
                </FlowLink>
              }
            >
              {m.addDomainText}
            </FlowNotice>
          ) : null}
          <section className="ws-console-card" aria-labelledby="home-checklist">
            <div className="ws-console-card__head">
              <span className="home-progress" aria-hidden="true">
                {m.progressShort(done, steps.length)}
              </span>
              <span className="home-checklist__titles">
                <h2 id="home-checklist" className="ws-console-section-title">
                  {done === steps.length ? m.checklistDone : m.checklistTitle(organisation)}
                </h2>
                <span className="ws-console-note">
                  {m.checklistProgress(done, steps.length)}
                  {done < steps.length ? ` · ${m.checklistLater}` : null}
                </span>
              </span>
            </div>
            <ol className="home-checklist" aria-label={m.checklistLabel}>
              {steps.map((step) => (
                <li key={step.key} data-state={step.state}>
                  <span className="home-checklist__mark" aria-hidden="true">
                    {step.state === 'done' ? <FlowIcon name="check" /> : step.state === 'later' ? <FlowIcon name="clock" /> : null}
                  </span>
                  <span className="home-checklist__text">
                    <span className="home-checklist__title">{step.title}</span>
                    <span className="ws-console-note">{step.detail}</span>
                  </span>
                  {step.state === 'done' ? (
                    <StatusTag tone="success">{m.stepDone}</StatusTag>
                  ) : step.state === 'later' ? (
                    <StatusTag>{m.stepLater}</StatusTag>
                  ) : step.action ? (
                    <FlowLink href={step.action.href} variant="quiet">
                      {step.action.label}
                    </FlowLink>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
          <div className="ws-console-cards">
            <ConsoleCard
              title={m.users}
              icon="people"
              action={
                <FlowLink href={`/u/${slot}/users`} variant="link">
                  {m.viewAll}
                </FlowLink>
              }
            >
              <p>{people.data ? m.people(people.data.length, people.data.filter((one) => one.status === 'invited').length) : people.isError ? m.peopleUnknown : null}</p>
            </ConsoleCard>
            <ConsoleCard
              title={m.domain}
              icon="globe"
              action={
                <FlowLink href={`/u/${slot}/domains`} variant="link">
                  {m.manage}
                </FlowLink>
              }
            >
              {primary ? (
                <>
                  <p className="home-domain" translate="no">
                    {primary.domain}
                  </p>
                  <ConsoleFacts
                    facts={[
                      { label: m.ownership, value: <StatusTag tone={verified ? 'success' : 'warning'}>{verified ? m.verified : m.notVerified}</StatusTag> },
                      { label: m.mail, value: <StatusTag tone={primary.mxConfigured ? 'success' : 'neutral'}>{primary.mxConfigured ? m.on : m.off}</StatusTag> },
                      { label: m.protection, value: <StatusTag>{m.notYet}</StatusTag> },
                    ]}
                  />
                </>
              ) : (
                <p className="ws-console-muted">{m.noDomain}</p>
              )}
            </ConsoleCard>
            <ConsoleCard
              title={m.billing}
              icon="card"
              action={
                <FlowLink href={`/u/${slot}/billing`} variant="link">
                  {m.details}
                </FlowLink>
              }
            >
              <p className="ws-console-muted">{m.billingLater}</p>
            </ConsoleCard>
            <ConsoleCard
              title={m.security}
              icon="shield"
              action={
                <FlowLink href={`/u/${slot}/security`} variant="link">
                  {m.review}
                </FlowLink>
              }
            >
              <p className="ws-console-muted">{m.securityLater}</p>
            </ConsoleCard>
          </div>
        </>
      )}
    </ConsolePage>
  );
}
