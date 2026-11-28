import { useQuery } from '@tanstack/react-query';
import type { Session } from '@yahel/auth';
import { AccountFace, ConsolePage, ConsolePlaceholder, DataTable, FlowButton, FlowChip, FlowChips, FlowIcon, FlowNotice, FlowTextField, StatusTag } from '@yahel/ui';
import type { ConsoleCrumb, DataTableColumn } from '@yahel/ui';
import { useStore } from 'zustand';
import { personWords as w, usersMessages as m } from './messages';
import { countsOf, filterPeople, nameOf, personOf, statusFilters, statusIcon, statusTone, whenOf } from './people';
import type { Person, StatusFilter } from './people';
import { membersQuery } from './queries';

export interface UsersSearch {
  q: string;
  status: StatusFilter;
}

export interface UsersPageProps {
  session: Session;
  tenantId: string;
  organisation: string;
  slot: string;
  crumbs: ConsoleCrumb[];
  crumbsLabel: string;
  search: UsersSearch;
  /** The search and the chip are part of the address, so a view can be shared or bookmarked. */
  onSearch: (next: UsersSearch) => void;
}

/** A person's face: their picture or initials when Admin knows them, otherwise a plain outline. */
export function PersonFace({ person, size = 'small' }: { person: Person; size?: 'small' | 'large' }) {
  if (person.name && person.email) return <AccountFace name={person.name} email={person.email} initials={person.initials} size={size} />;
  return (
    <span className={`ws-flow-avatar ws-flow-avatar--outline${size === 'small' ? ' ws-flow-avatar--small' : ''}`} aria-hidden="true">
      <FlowIcon name="person" />
    </span>
  );
}

export const PersonStatus = ({ person }: { person: Person }) => (
  <StatusTag tone={statusTone[person.member.status]} icon={statusIcon[person.member.status]}>
    {w.status[person.member.status]}
  </StatusTag>
);

/** Who is in the organisation: a table with search and status chips, each row opening the person's page. */
export function UsersPage({ session, tenantId, organisation, slot, crumbs, crumbsLabel, search, onSearch }: UsersPageProps) {
  const me = useStore(session.store, (state) => state.profile);
  const members = useQuery(membersQuery(session, tenantId));
  const people = (members.data ?? []).map((member) => personOf(member, me)).sort((a, b) => Number(b.isYou) - Number(a.isYou));
  const counts = countsOf(people);
  const shown = filterPeople(people, search.q, search.status);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const columns: DataTableColumn<Person>[] = [
    {
      id: 'name',
      header: m.columns.name,
      cell: (person) => (
        <span className="ws-console-person">
          <PersonFace person={person} />
          <span className="ws-console-person__text">
            <span>{nameOf(person)}</span>
            <span className="ws-console-person__sub">{person.email ?? w.added(whenOf(person.member.createdAt) ?? w.notYet)}</span>
          </span>
        </span>
      ),
    },
    { id: 'role', header: m.columns.role, cell: (person) => w.role[person.member.role] },
    { id: 'status', header: m.columns.status, cell: (person) => <PersonStatus person={person} /> },
    { id: 'last', header: m.columns.lastSignIn, cell: (person) => whenOf(person.member.lastActiveAt) ?? w.notYet, secondary: true },
  ];

  const empty = search.q ? (
    <ConsolePlaceholder
      icon="search"
      align="center"
      title={m.noMatchTitle(search.q)}
      action={
        <FlowButton variant="quiet" onPress={() => onSearch({ ...search, q: '' })}>
          {m.clearSearch}
        </FlowButton>
      }
    >
      {m.noMatch}
    </ConsolePlaceholder>
  ) : (
    <ConsolePlaceholder
      icon="people"
      align="center"
      title={m.noneWithStatus(search.status === 'all' ? m.all : w.status[search.status])}
      action={
        <FlowButton variant="quiet" onPress={() => onSearch({ ...search, status: 'all' })}>
          {m.showAll}
        </FlowButton>
      }
    >
      {null}
    </ConsolePlaceholder>
  );

  return (
    <ConsolePage
      crumbs={crumbs}
      crumbsLabel={crumbsLabel}
      title={m.title}
      lede={members.data ? m.count(people.length, organisation) : undefined}
      actions={
        <FlowButton variant="primary" isDisabled>
          {m.add}
        </FlowButton>
      }
    >
      <p className="ws-console-note">{m.addLater}</p>
      {members.isPending ? (
        <div role="status" aria-label={m.loading} className="ws-skeleton console__placeholder" />
      ) : members.isError ? (
        <FlowNotice tone="danger" actions={<FlowButton onPress={() => void members.refetch()}>{m.tryAgain}</FlowButton>}>
          {m.failed}
        </FlowNotice>
      ) : (
        <>
          {people.some((person) => !person.name) ? <FlowNotice tone="info">{m.namesNotice}</FlowNotice> : null}
          <div className="users-tools">
            <span className="users-tools__search">
              <FlowTextField label={m.search} help={m.searchPlaceholder} value={search.q} onChange={(q) => onSearch({ ...search, q })} type="search" autoComplete="off" spellCheck="false" />
            </span>
            <FlowChips label={m.filter} isLabelHidden value={search.status} onChange={(status) => onSearch({ ...search, status })} layout="compact">
              {statusFilters.map((status) => (
                <FlowChip key={status} value={status} badge={String(counts[status])}>
                  {status === 'all' ? m.all : w.status[status]}
                </FlowChip>
              ))}
            </FlowChips>
          </div>
          <DataTable
            label={m.table}
            columns={columns}
            rows={shown}
            rowKey={(person) => person.member._id}
            rowHref={(person) => `/u/${slot}/users/${person.member._id}`}
            empty={empty}
          />
          <p className="ws-console-note">
            {m.timeZone(zone)}
            {people.length >= 100 ? ` ${m.firstHundred(people.length)}` : null}
          </p>
        </>
      )}
    </ConsolePage>
  );
}
