import { useQuery } from '@tanstack/react-query';
import type { Session } from '@yahel/auth';
import { ConsolePage, FlowButton, FlowIcon, FlowLink, FlowNotice, FlowSelect, FlowTextField } from '@yahel/ui';
import type { ConsoleCrumb } from '@yahel/ui';
import { useState } from 'react';
import { addMessages as m } from './messages';
import { domainsQuery, unitsQuery } from './queries';
import { rootOf } from './units';

export interface NewPerson {
  first: string;
  last: string;
  username: string;
  /** Whether the username was typed rather than suggested from the name. */
  typed: boolean;
  domain: string;
  sendTo: string;
}

const blank = (domain: string): NewPerson => ({ first: '', last: '', username: '', typed: false, domain, sendTo: '' });
const filled = (row: NewPerson) => !!(row.first || row.last || row.username || row.sendTo);

/** The address a name suggests: "Femi Adebayo" becomes "femi.adebayo". */
export const suggestUsername = (first: string, last: string) =>
  [first, last]
    .map((part) => part.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ''))
    .filter(Boolean)
    .join('.');

/** What is wrong with each filled row, by row index. */
export const problemsOf = (rows: readonly NewPerson[]) => {
  const problems: Record<number, string> = {};
  rows.forEach((row, index) => {
    if (!filled(row)) return;
    const n = index + 1;
    if (!row.first.trim()) problems[index] = m.needFirst(n);
    else if (!/^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/.test(row.username)) problems[index] = m.badUsername(n);
    else if (row.sendTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.sendTo)) problems[index] = m.badEmail(n);
  });
  return problems;
};

/** Rows typed in, with one empty row always waiting at the end. */
export const withSpareRow = (rows: NewPerson[], domain: string) => (rows.length && !filled(rows[rows.length - 1]!) ? rows : [...rows, blank(domain)]);

export interface AddPeoplePageProps {
  session: Session;
  tenantId: string;
  slot: string;
  crumbs: ConsoleCrumb[];
  crumbsLabel: string;
}

/**
 * Adding people with a new address on the organisation's domain. The form is as designed, but creating such
 * accounts has no endpoint yet, so the last step is disabled and says so (backend gap).
 */
export function AddPeoplePage({ session, tenantId, slot, crumbs, crumbsLabel }: AddPeoplePageProps) {
  const domains = useQuery(domainsQuery(session, tenantId));
  const units = useQuery(unitsQuery(session, tenantId));
  const verified = (domains.data ?? []).filter((domain) => domain.status === 'verified').sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  const first = verified[0]?.domain ?? '';
  const [rows, setRows] = useState<NewPerson[]>([]);
  const [unit, setUnit] = useState('');
  const shownRows = withSpareRow(rows.map((row) => (row.domain ? row : { ...row, domain: first })), first);
  const problems = problemsOf(shownRows);
  const ready = shownRows.filter((row, index) => filled(row) && !problems[index]).length;
  const root = rootOf(units.data ?? []);

  const change = (index: number, patch: Partial<NewPerson>) => {
    const next = shownRows.map((row, at) => {
      if (at !== index) return row;
      const merged = { ...row, ...patch };
      return merged.typed ? merged : { ...merged, username: suggestUsername(merged.first, merged.last) };
    });
    setRows(withSpareRow(next, first));
  };

  return (
    <ConsolePage crumbs={[...crumbs, { label: m.title }]} crumbsLabel={crumbsLabel} title={m.title} lede={m.lede}>
      <FlowNotice tone="info">{m.later}</FlowNotice>
      {domains.data && !first ? <FlowNotice tone="warning">{m.noDomain}</FlowNotice> : null}
      <ol className="add-people" aria-label={m.rows}>
        {shownRows.map((row, index) => (
          <li key={index} className="add-people__row" aria-label={m.row(index + 1)}>
            <FlowTextField label={m.first} value={row.first} onChange={(value) => change(index, { first: value })} autoComplete="off" />
            <FlowTextField label={m.last} value={row.last} onChange={(value) => change(index, { last: value })} autoComplete="off" />
            <span className="add-people__address">
              <FlowTextField label={m.username} value={row.username} onChange={(value) => change(index, { username: value.trim().toLowerCase(), typed: !!value })} autoComplete="off" spellCheck="false" />
              <FlowSelect label={m.domain} value={row.domain} onChange={(value) => change(index, { domain: value })}>
                {verified.map((domain) => (
                  <option key={domain._id} value={domain.domain}>
                    {m.at(domain.domain)}
                  </option>
                ))}
              </FlowSelect>
            </span>
            <FlowTextField label={m.sendTo} type="email" value={row.sendTo} onChange={(value) => change(index, { sendTo: value.trim() })} autoComplete="off" />
            {filled(row) ? (
              <FlowButton variant="round" aria-label={m.remove(index + 1)} onPress={() => setRows(withSpareRow(shownRows.filter((_, at) => at !== index), first))}>
                <FlowIcon name="close" />
              </FlowButton>
            ) : (
              <span className="add-people__spacer" />
            )}
            {problems[index] ? (
              <p className="ws-flow-field__error add-people__problem" role="alert">
                {problems[index]}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
      {units.data?.length ? (
        <span className="add-people__unit">
          <FlowSelect label={m.unit} value={unit || root?._id || ''} onChange={setUnit}>
            {units.data.map((one) => (
              <option key={one._id} value={one._id}>
                {one.name}
              </option>
            ))}
          </FlowSelect>
        </span>
      ) : null}
      <div className="add-people__foot">
        <span className="ws-console-muted">{ready ? m.ready(ready) : m.none}</span>
        <FlowLink variant="quiet" href={`/u/${slot}/users`}>
          {m.cancel}
        </FlowLink>
        <FlowButton variant="primary" isDisabled>
          {m.add(ready)}
        </FlowButton>
      </div>
    </ConsolePage>
  );
}
