import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WorkspaceDomain } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { ConsoleCard, ConsoleDialog, ConsoleFacts, ConsolePage, FlowButton, FlowLink, FlowNotice, FlowTextField, StatusTag } from '@yahel/ui';
import type { ConsoleCrumb } from '@yahel/ui';
import { useState } from 'react';
import { notify } from '../../toast';
import { needsRecord } from './domain-record';
import { failureOf } from './feedback';
import { domainMessages as m } from './messages';
import { domainsQuery } from './queries';

export interface DomainsPageProps {
  session: Session;
  tenantId: string;
  slot: string;
  crumbs?: ConsoleCrumb[];
  crumbsLabel?: string;
}

const DOMAIN = /^(?=.{4,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;
const normalised = (value: string) => value.trim().toLowerCase().replace(/^@+/, '').replace(/\.$/, '');

/** The organisation's domains: the primary one and how it is set up, the others, and adding one. Verifying happens in Domain setup. */
export function DomainsPage({ session, tenantId, slot, crumbs, crumbsLabel }: DomainsPageProps) {
  const domains = useQuery(domainsQuery(session, tenantId));
  const primary = domains.data?.find((domain) => domain.isPrimary) ?? null;
  const others = domains.data?.filter((domain) => domain !== primary) ?? [];

  return (
    <ConsolePage crumbs={crumbs} crumbsLabel={crumbsLabel} title={m.title} lede={m.lede}>
      {domains.isPending ? (
        <div role="status" aria-label={m.loading} className="ws-skeleton console__placeholder" />
      ) : domains.isError ? (
        <FlowNotice tone="danger" actions={<FlowButton onPress={() => void domains.refetch()}>{m.tryAgain}</FlowButton>}>
          {m.failed}
        </FlowNotice>
      ) : (
        <>
          {domains.data.length === 0 ? <FlowNotice>{m.empty}</FlowNotice> : null}
          {primary ? <DomainCard session={session} tenantId={tenantId} slot={slot} domain={primary} /> : null}
          {others.length ? (
            <section className="ws-console-page" aria-labelledby="domains-others">
              <h2 id="domains-others" className="ws-console-section-title">
                {m.others}
              </h2>
              {others.map((domain) => (
                <DomainCard key={domain._id} session={session} tenantId={tenantId} slot={slot} domain={domain} level={3} />
              ))}
            </section>
          ) : null}
          <p className="ws-console-note">{m.later}</p>
        </>
      )}
      <AddDomain session={session} tenantId={tenantId} />
    </ConsolePage>
  );
}

interface DomainCardProps {
  session: Session;
  tenantId: string;
  slot: string;
  domain: WorkspaceDomain;
  level?: 2 | 3;
}

function DomainCard({ session, tenantId, slot, domain, level = 2 }: DomainCardProps) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: domainsQuery(session, tenantId).queryKey });
  const primary = useMutation({
    mutationFn: () => session.api.tenants.domains.setPrimary(tenantId, domain._id),
    onSuccess: () => notify(m.madePrimary(domain.domain)),
    onError: (error) => notify(failureOf(error, 'primary', domain.domain), 'danger'),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: () => session.api.tenants.domains.remove(tenantId, domain._id),
    onSuccess: () => notify(m.removed(domain.domain)),
    onError: (error) => notify(failureOf(error, 'remove', domain.domain), 'danger'),
    onSettled: () => {
      setConfirming(false);
      return refresh();
    },
  });
  const verified = domain.status === 'verified';
  const busy = primary.isPending || remove.isPending;

  return (
    <ConsoleCard title={domain.domain} icon="globe" level={level} action={domain.isPrimary ? <StatusTag tone="info">{m.primary}</StatusTag> : null}>
      <ConsoleFacts
        facts={[
          { label: m.ownership, value: <StatusTag tone={verified ? 'success' : 'warning'}>{m.status[domain.status] ?? domain.status}</StatusTag> },
          { label: m.mail, value: <StatusTag tone={domain.mxConfigured ? 'success' : 'neutral'}>{domain.mxConfigured ? m.on : m.off}</StatusTag> },
          { label: m.protection, value: <StatusTag>{m.notYet}</StatusTag> },
        ]}
      />
      <div className="user-actions">
        {needsRecord(domain) ? (
          <FlowLink href={`/u/${slot}/setup?step=record&domain=${encodeURIComponent(domain._id)}`} variant="primary" aria-label={m.verifyLabel(domain.domain)}>
            {m.verify}
          </FlowLink>
        ) : null}
        {verified && !domain.isPrimary ? (
          <FlowButton onPress={() => primary.mutate()} isPending={primary.isPending} pendingLabel={m.makingPrimary} isDisabled={busy}>
            {m.makePrimary}
          </FlowButton>
        ) : null}
        {domain.isPrimary ? null : (
          <FlowButton variant="destructive" aria-label={m.removeLabel(domain.domain)} onPress={() => setConfirming(true)} isDisabled={busy}>
            {m.remove}
          </FlowButton>
        )}
      </div>
      <ConsoleDialog
        isOpen={confirming}
        onOpenChange={(open) => (open || remove.isPending ? undefined : setConfirming(false))}
        title={m.removeTitle(domain.domain)}
        actions={
          <>
            <FlowButton variant="quiet" onPress={() => setConfirming(false)} isDisabled={remove.isPending}>
              {m.cancel}
            </FlowButton>
            <FlowButton variant="destructive" onPress={() => remove.mutate()} isPending={remove.isPending} pendingLabel={m.removing}>
              {m.remove}
            </FlowButton>
          </>
        }
      >
        <p>{m.removeBody}</p>
      </ConsoleDialog>
    </ConsoleCard>
  );
}

function AddDomain({ session, tenantId }: { session: Session; tenantId: string }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const add = useMutation({
    mutationFn: (domain: string) => session.api.tenants.domains.add(tenantId, { domain, method: 'TXT', autoProvisionMode: 'off' }),
    onSuccess: (added) => {
      setValue('');
      notify(m.added(added.domain.domain));
      return queryClient.invalidateQueries({ queryKey: domainsQuery(session, tenantId).queryKey });
    },
    onError: (error, domain) => setProblem(failureOf(error, 'add', domain)),
  });
  const submit = () => {
    if (add.isPending) return;
    const domain = normalised(value);
    if (!DOMAIN.test(domain)) {
      setProblem(m.invalidDomain);
      return;
    }
    setProblem(null);
    add.mutate(domain);
  };

  return (
    <ConsoleCard title={m.addTitle} icon="plus">
      <form
        className="users-tools"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <span className="users-tools__search">
          <FlowTextField label={m.addLabel} help={m.addHelp} value={value} onChange={setValue} error={problem ?? undefined} autoComplete="off" spellCheck="false" inputMode="url" />
        </span>
        <FlowButton type="submit" isPending={add.isPending} pendingLabel={m.adding}>
          {m.add}
        </FlowButton>
      </form>
    </ConsoleCard>
  );
}
