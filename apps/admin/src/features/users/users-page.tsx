import { useQuery } from '@tanstack/react-query';
import type { Session } from '@yahel/auth';
import { AccountFace, ConsolePage, ConsolePanel, ConsolePlaceholder, DataTable, FilterChip, FlowButton, FlowChip, FlowChips, FlowIcon, FlowLink, FlowNotice, FlowTextField, StatusTag, useCompactConsole } from '@yahel/ui';
import type { ConsoleCrumb, DataTableColumn } from '@yahel/ui';
import { useState } from 'react';
import { useStore } from 'zustand';
import { BulkActions } from './bulk-actions';
import { DownloadDialog } from './download-dialog';
import { personWords as w, usersMessages as m } from './messages';
import { MoreMenu } from './more-menu';
import { countsOf, filterPeople, nameOf, personOf, statusFilters, statusIcon, statusTone, whenOf } from './people';
import type { Person, StatusFilter } from './people';
import { membersQuery, unitsQuery } from './queries';
import { UnitsPanel } from './units-panel';
import type { UnitPick } from './units-panel';
import { isInUnits, rootOf, treeOf, unitOf } from './units';

export interface UsersSearch {
  q: string;
  status: StatusFilter;
  /** The units picked; none means everyone. */
  units: string[];
  pick: UnitPick;
}

export interface UsersPageProps {
  session: Session;
  tenantId: string;
  organisation: string;
  slot: string;
  crumbs: ConsoleCrumb[];
  crumbsLabel: string;
  search: UsersSearch;
  /** The search, the status and the units are part of the address, so a view can be shared or bookmarked. */
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

/** Who is in the organisation: units to narrow by, a table with search and status, and actions on the people selected. */
export function UsersPage({ session, tenantId, organisation, slot, crumbs, crumbsLabel, search, onSearch }: UsersPageProps) {
  const me = useStore(session.store, (state) => state.profile);
  const members = useQuery(membersQuery(session, tenantId));
  const unitList = useQuery(unitsQuery(session, tenantId));
  const compact = useCompactConsole();
  const [unitsHidden, setUnitsHidden] = useState(false);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const units = unitList.data ?? [];
  const root = rootOf(units);
  const people = (members.data ?? []).map((member) => personOf(member, me)).sort((a, b) => Number(b.isYou) - Number(a.isYou));
  const picked = search.units.filter((id) => units.some((unit) => unit._id === id) && !(search.pick === 'one' && id === root?._id));
  const inScope = picked.length ? people.filter(({ member }) => isInUnits(member, picked, units)) : people;
  const unitName = (person: Person) => unitOf(person.member, units)?.name ?? '';
  const counts = countsOf(inScope);
  const shown = filterPeople(inScope, search.q, search.status, unitName);
  const chosen = people.filter((person) => selected.has(person.member._id));
  const guests = people.filter(({ member }) => member.type === 'guest').length;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const pickedUnits = units.filter((unit) => picked.includes(unit._id));
  const setUnits = (next: { pick: UnitPick; units: string[] }) => onSearch({ ...search, pick: next.pick, units: next.units });
  const stop = (id: string) => setUnits({ pick: search.pick, units: picked.filter((one) => one !== id) });
  const rowsOf = (list: readonly Person[]) => list.map((person) => ({ person, unit: unitName(person) }));

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
    { id: 'unit', header: m.columns.unit, cell: unitName, secondary: true },
    { id: 'role', header: m.columns.role, cell: (person) => w.role[person.member.role] },
    { id: 'status', header: m.columns.status, cell: (person) => <PersonStatus person={person} /> },
    { id: 'last', header: m.columns.lastSignIn, cell: (person) => whenOf(person.member.lastActiveAt) ?? w.notYet, secondary: true },
  ];

  const reset = (
    <FlowButton variant="quiet" onPress={() => onSearch({ q: '', status: 'all', units: [], pick: search.pick })}>
      {m.showAll}
    </FlowButton>
  );
  const empty = (
    <ConsolePlaceholder icon={search.q ? 'search' : 'people'} align="center" title={search.q ? m.noMatchTitle(search.q) : search.status !== 'all' ? m.noneWithStatus(w.status[search.status]) : m.noneInUnits} action={reset}>
      {search.q ? m.noMatch : null}
    </ConsolePlaceholder>
  );

  const panel = (onHide?: () => void) => (
    <UnitsPanel tree={treeOf(units, people.map(({ member }) => member))} pick={search.pick} selected={picked.length ? picked : root ? [root._id] : []} onChange={setUnits} manageHref={`/u/${slot}/later/ous`} onHide={onHide} />
  );
  const showPanel = !compact && !unitsHidden && units.length > 0;

  return (
    <ConsolePage
      crumbs={crumbs}
      crumbsLabel={crumbsLabel}
      title={m.title}
      lede={members.data ? m.count(people.length - guests, guests, organisation) : undefined}
      actions={
        <>
          <FlowButton variant="quiet" onPress={() => setDownloading(true)} isDisabled={!members.data}>
            <FlowIcon name="download" />
            {m.download}
          </FlowButton>
          <MoreMenu session={session} tenantId={tenantId} slot={slot} />
          <FlowLink variant="primary" href={`/u/${slot}/users/add`}>
            {m.add}
          </FlowLink>
        </>
      }
    >
      {members.isPending ? (
        <div role="status" aria-label={m.loading} className="ws-skeleton console__placeholder" />
      ) : members.isError ? (
        <FlowNotice tone="danger" actions={<FlowButton onPress={() => void members.refetch()}>{m.tryAgain}</FlowButton>}>
          {m.failed}
        </FlowNotice>
      ) : (
        <div className="users-layout">
          {showPanel ? panel(() => setUnitsHidden(true)) : null}
          <div className="users-main">
            {people.some((person) => !person.name) ? <FlowNotice tone="info">{m.namesNotice}</FlowNotice> : null}
            <div className="users-scope">
              {units.length && (compact || unitsHidden) ? (
                <FlowButton variant="quiet" onPress={() => (compact ? setUnitsOpen(true) : setUnitsHidden(false))}>
                  <FlowIcon name="unit" />
                  {m.units.show}
                </FlowButton>
              ) : null}
              {pickedUnits.length === 0 ? (
                <span>{m.scope.everyone(organisation)}</span>
              ) : (
                <>
                  <span>{search.pick === 'one' ? m.scope.oneLabel : m.scope.several(pickedUnits.length)}</span>
                  {pickedUnits.map((unit) => (
                    <FilterChip key={unit._id} removeLabel={m.scope.stop(unit.name)} onRemove={() => stop(unit._id)}>
                      {search.pick === 'one' ? m.scope.withInside(unit.name) : unit.name}
                    </FilterChip>
                  ))}
                </>
              )}
            </div>
            {unitList.isError ? <p className="ws-console-note">{m.units.failed}</p> : null}
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
            {chosen.length ? <BulkActions session={session} tenantId={tenantId} organisation={organisation} selected={chosen} everyone={people} units={units} onClear={() => setSelected(new Set())} /> : null}
            <DataTable
              label={m.table}
              columns={columns}
              rows={shown}
              rowKey={(person) => person.member._id}
              rowHref={(person) => `/u/${slot}/users/${person.member._id}`}
              empty={empty}
              selection={{ selected, onChange: setSelected, allLabel: m.selectAll, rowLabel: (person) => m.select(nameOf(person)) }}
            />
            <p className="ws-console-note users-foot">
              <span>{shown.length === people.length ? m.shown(shown.length) : m.shownOf(shown.length, people.length)}</span>
              <span>{m.clickHint}</span>
            </p>
            <p className="ws-console-note">
              {m.timeZone(zone)}
              {people.length >= 100 ? ` ${m.firstHundred(people.length)}` : null}
            </p>
          </div>
        </div>
      )}
      <ConsolePanel isOpen={compact && unitsOpen} onOpenChange={setUnitsOpen} title={m.units.title} closeLabel={m.units.close}>
        {panel()}
      </ConsolePanel>
      {downloading ? <DownloadDialog isOpen onClose={() => setDownloading(false)} organisation={organisation} shown={rowsOf(shown)} picked={rowsOf(chosen)} /> : null}
    </ConsolePage>
  );
}
