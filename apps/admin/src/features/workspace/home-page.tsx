import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { Session } from '@yahel/auth';
import { Banner, Button, Card } from '@yahel/ui';
import { needsRecord } from './domain-record';
import { homeMessages as m } from './messages';
import { domainsQuery, workspaceQuery } from './queries';

export interface HomePageProps {
  session: Session;
  tenantId: string;
  /** The workspace's name from the session's context, shown until the workspace itself answers. */
  name: string;
  slot: string;
}

/** Admin's home: the workspace, and what is left to set up. */
export function HomePage({ session, tenantId, name, slot }: HomePageProps) {
  const workspace = useQuery(workspaceQuery(session, tenantId));
  const domains = useQuery(domainsQuery(session, tenantId));
  const unverified = domains.data?.find(needsRecord);

  return (
    <div className="page">
      <header className="stack">
        <p className="ws-secondary">{m.workspace}</p>
        <h1 className="ws-large-title">{workspace.data?.displayName || name}</h1>
      </header>
      {domains.isPending ? (
        <div role="status" aria-label={m.loading} className="ws-skeleton console__placeholder" />
      ) : domains.isError || workspace.isError ? (
        <Banner tone="danger">
          <span className="row">
            <span className="grow">{m.failed}</span>
            <Button
              onPress={() => {
                void domains.refetch();
                void workspace.refetch();
              }}
            >
              {m.tryAgain}
            </Button>
          </span>
        </Banner>
      ) : unverified ? (
        <Card className="stack setup">
          <p className="ws-footnote">{m.setupTitle}</p>
          <h2 className="ws-title-2">{m.verify(unverified.domain)}</h2>
          <p className="ws-secondary">{m.verifyLede}</p>
          <div className="row">
            <Link to="/u/$slot/domains" params={{ slot }} className="link">
              {m.toDomains}
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="stack setup">
          <h2 className="ws-title-2">{domains.data.length > 0 ? m.readyTitle : m.addDomain}</h2>
          <p className="ws-secondary">{domains.data.length > 0 ? m.ready : m.noDomains}</p>
          <div className="row">
            <Link to="/u/$slot/domains" params={{ slot }} className="link">
              {m.toDomains}
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
