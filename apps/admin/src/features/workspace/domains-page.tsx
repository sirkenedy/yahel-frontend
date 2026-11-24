import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DomainVerificationRecord, WorkspaceDomain } from '@yahel/api-client';
import type { Session } from '@yahel/auth';
import { Banner, Button, Card, TextField } from '@yahel/ui';
import { useState } from 'react';
import { recordOf, needsRecord } from './domain-record';
import { failureOf } from './feedback';
import { domainMessages as m } from './messages';
import { domainsQuery, issuedRecordsQuery, keepIssuedRecord } from './queries';

export interface DomainsPageProps {
  session: Session;
  tenantId: string;
}

const DOMAIN = /^(?=.{4,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;
const normalised = (value: string) => value.trim().toLowerCase().replace(/^@+/, '').replace(/\.$/, '');

type Notice = { tone: 'neutral' | 'danger'; text: string } | null;

/** The workspace's domains: each one's state, the record a pending one needs, and verifying, making primary, adding and removing. */
export function DomainsPage({ session, tenantId }: DomainsPageProps) {
  const domains = useQuery(domainsQuery(session, tenantId));
  const issued = useQuery(issuedRecordsQuery(tenantId));
  const [notice, setNotice] = useState<Notice>(null);

  return (
    <div className="page">
      <header className="stack">
        <h1 className="ws-large-title">{m.title}</h1>
        <p className="ws-secondary">{m.lede}</p>
      </header>
      {notice ? <Banner tone={notice.tone}>{notice.text}</Banner> : null}
      {domains.isPending ? (
        <div role="status" aria-label={m.loading} className="ws-skeleton console__placeholder" />
      ) : domains.isError ? (
        <Banner tone="danger">
          <span className="row">
            <span className="grow">{m.failed}</span>
            <Button onPress={() => void domains.refetch()}>{m.tryAgain}</Button>
          </span>
        </Banner>
      ) : domains.data.length === 0 ? (
        <Card>
          <p>{m.empty}</p>
        </Card>
      ) : (
        <ul className="domains" aria-label={m.list}>
          {domains.data.map((domain) => (
            <DomainItem key={domain._id} session={session} tenantId={tenantId} domain={domain} issued={issued.data[domain._id]} onNotice={setNotice} />
          ))}
        </ul>
      )}
      <AddDomain session={session} tenantId={tenantId} onNotice={setNotice} />
    </div>
  );
}

interface DomainItemProps {
  session: Session;
  tenantId: string;
  domain: WorkspaceDomain;
  issued: DomainVerificationRecord | undefined;
  onNotice: (notice: Notice) => void;
}

function DomainItem({ session, tenantId, domain, issued, onNotice }: DomainItemProps) {
  const queryClient = useQueryClient();
  const [problem, setProblem] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: domainsQuery(session, tenantId).queryKey });
  const fail = (action: Parameters<typeof failureOf>[1]) => (error: unknown) => {
    setProblem(failureOf(error, action, domain.domain));
    void refresh();
  };
  const verify = useMutation({
    mutationFn: () => session.api.tenants.domains.verify(tenantId, domain._id),
    onMutate: () => setProblem(null),
    onSuccess: () => {
      onNotice({ tone: 'neutral', text: m.verified(domain.domain) });
      return refresh();
    },
    onError: fail('verify'),
  });
  const primary = useMutation({
    mutationFn: () => session.api.tenants.domains.setPrimary(tenantId, domain._id),
    onMutate: () => setProblem(null),
    onSuccess: () => {
      onNotice({ tone: 'neutral', text: m.madePrimary(domain.domain) });
      return refresh();
    },
    onError: fail('primary'),
  });
  const remove = useMutation({
    mutationFn: () => session.api.tenants.domains.remove(tenantId, domain._id),
    onMutate: () => setProblem(null),
    onSuccess: () => {
      onNotice({ tone: 'neutral', text: m.removed(domain.domain) });
      return refresh();
    },
    onError: (error) => {
      setConfirming(false);
      fail('remove')(error);
    },
  });
  const busy = verify.isPending || primary.isPending || remove.isPending;
  const record = needsRecord(domain) ? recordOf(domain, issued) : null;
  const status = m.status[domain.status] ?? domain.status;

  return (
    <li>
      <Card className="stack domain">
        <div className="row">
          <h2 className="ws-title-3 grow" translate="no">
            {domain.domain}
          </h2>
          {domain.isPrimary ? <span className="ws-tag ws-tag--accent">{m.primary}</span> : null}
          <span className={`ws-tag ${domain.status === 'verified' ? 'ws-tag--success' : 'ws-tag--warning'}`}>{status}</span>
        </div>
        {record ? <RecordDetails domain={domain.domain} record={record} /> : null}
        {problem ? <Banner tone="danger">{problem}</Banner> : null}
        {confirming ? (
          <div className="stack">
            <p>{m.confirmRemove(domain.domain)}</p>
            <div className="row">
              <Button variant="destructive" onPress={() => remove.mutate()} isPending={remove.isPending} pendingLabel={m.removing}>
                {m.remove}
              </Button>
              <Button onPress={() => setConfirming(false)} isDisabled={remove.isPending}>
                {m.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="row">
            {record ? (
              <Button variant="primary" onPress={() => verify.mutate()} isPending={verify.isPending} pendingLabel={m.verifying} isDisabled={busy && !verify.isPending}>
                {m.verify}
              </Button>
            ) : null}
            {domain.status === 'verified' && !domain.isPrimary ? (
              <Button onPress={() => primary.mutate()} isPending={primary.isPending} pendingLabel={m.makingPrimary} isDisabled={busy && !primary.isPending}>
                {m.makePrimary}
              </Button>
            ) : null}
            {domain.isPrimary ? null : (
              <Button variant="plain" aria-label={m.removeLabel(domain.domain)} onPress={() => setConfirming(true)} isDisabled={busy}>
                {m.remove}
              </Button>
            )}
          </div>
        )}
      </Card>
    </li>
  );
}

function RecordDetails({ domain, record }: { domain: string; record: ReturnType<typeof recordOf> }) {
  return (
    <section className="stack record" aria-label={m.recordTitle}>
      <h3 className="ws-headline">{m.recordTitle}</h3>
      <p className="ws-secondary">{m.recordSteps(domain)}</p>
      <dl className="details">
        <div>
          <dt>{m.type}</dt>
          <dd translate="no">{record.type}</dd>
        </div>
        <div>
          <dt>{m.host}</dt>
          <dd className="row">
            <code className="grow">{record.host ?? m.hostSelf}</code>
            <CopyButton what={m.host} text={record.host ?? '@'} />
          </dd>
        </div>
        <div>
          <dt>{m.value}</dt>
          {record.value ? (
            <dd className="row">
              <code className="grow record__value">{record.value}</code>
              <CopyButton what={m.value} text={record.value} />
            </dd>
          ) : (
            <dd>{m.valueUnknown}</dd>
          )}
        </div>
      </dl>
    </section>
  );
}

function CopyButton({ what, text }: { what: string; text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copy = () =>
    navigator.clipboard
      ?.writeText(text)
      .then(() => setState('copied'))
      .catch(() => setState('failed')) ?? setState('failed');
  return (
    <>
      <Button variant="tinted" onPress={() => void copy()} aria-label={m.copy(what)}>
        {state === 'copied' ? m.copied : m.copy(what)}
      </Button>
      <span role="status" className={state === 'failed' ? 'ws-footnote' : 'ws-flow-hidden'}>
        {state === 'failed' ? m.copyFailed : state === 'copied' ? m.copied : ''}
      </span>
    </>
  );
}

function AddDomain({ session, tenantId, onNotice }: { session: Session; tenantId: string; onNotice: (notice: Notice) => void }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const add = useMutation({
    mutationFn: (domain: string) => session.api.tenants.domains.add(tenantId, { domain, method: 'TXT', autoProvisionMode: 'off' }),
    onSuccess: (added) => {
      keepIssuedRecord(queryClient, tenantId, added.domain._id, added.instructions);
      setValue('');
      onNotice({ tone: 'neutral', text: m.added(added.domain.domain) });
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
    <Card className="stack">
      <h2 className="ws-title-3">{m.addTitle}</h2>
      <form
        className="row add-domain"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <span className="grow">
          <TextField label={m.addLabel} help={m.addHelp} value={value} onChange={setValue} error={problem ?? undefined} autoComplete="off" spellCheck="false" inputMode="url" />
        </span>
        <Button type="submit" isPending={add.isPending} pendingLabel={m.adding}>
          {m.add}
        </Button>
      </form>
    </Card>
  );
}
