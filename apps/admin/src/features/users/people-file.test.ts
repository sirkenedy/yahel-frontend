import { describe, expect, it } from 'vitest';
import { peopleFile } from './people-file';
import { personOf } from './people';
import { me, owner, invited } from './test-session';

describe('peopleFile', () => {
  const rows = [
    { person: personOf(owner, me), unit: 'Lagos, "HQ"' },
    { person: personOf(invited, me), unit: '=HYPERLINK()' },
  ];

  it('writes CSV with quoted cells and formulas made plain text', () => {
    const { type, text } = peopleFile(rows, 'csv');
    expect(type).toBe('text/csv');
    const lines = text.trim().split('\r\n');
    expect(lines[0]).toBe('Name,Email,Unit,Role,Status,Last sign-in');
    expect(lines[1]).toContain('Amara Okafor,amara@northwind.example,"Lagos, ""HQ""",Owner,Active');
    expect(lines[2]).toContain(",'=HYPERLINK(),User,Invited,");
  });

  it('writes JSON with the same fields', () => {
    const records = JSON.parse(peopleFile(rows, 'json').text) as Record<string, string>[];
    expect(records[1]).toMatchObject({ name: '', unit: '=HYPERLINK()', role: 'User', status: 'Invited' });
  });
});
