import { usersMessages as m, personWords as w } from './messages';
import type { Person } from './people';

export type PeopleFormat = 'csv' | 'json';

export interface PeopleRow {
  person: Person;
  unit: string;
}

const csvCell = (value: string) => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** The people on screen as a file: one row each, with the columns the table shows. Cells that a spreadsheet would run as a formula are made plain text. */
export function peopleFile(rows: readonly PeopleRow[], format: PeopleFormat) {
  const records = rows.map(({ person, unit }) => ({
    name: person.name ?? '',
    email: person.email ?? '',
    unit,
    role: w.role[person.member.role],
    status: w.status[person.member.status],
    lastSignIn: person.member.lastActiveAt ?? '',
  }));
  if (format === 'json') return { type: 'application/json', text: `${JSON.stringify(records, null, 2)}\n` };
  const c = m.columns;
  const head = [c.name, c.email, c.unit, c.role, c.status, c.lastSignIn];
  const lines = [head, ...records.map((record) => [record.name, record.email, record.unit, record.role, record.status, record.lastSignIn])];
  return { type: 'text/csv', text: `${lines.map((line) => line.map(csvCell).join(',')).join('\r\n')}\r\n` };
}

/** Hands the browser a file to save. */
export function saveFile(name: string, file: { type: string; text: string }) {
  const url = URL.createObjectURL(new Blob([file.text], { type: file.type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
