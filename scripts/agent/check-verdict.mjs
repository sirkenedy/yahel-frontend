#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

// Reads the verdict a review agent wrote and fails the job unless it is an approval.
// A missing or malformed verdict fails: the gate closes when in doubt.
const [name] = process.argv.slice(2);
const path = `.agent/${name}-verdict.json`;

const fail = (message) => {
  console.error(`::error::${name}: ${message}`);
  process.exit(1);
};

if (!existsSync(path)) fail(`no verdict file at ${path}`);

let verdict;
try {
  verdict = JSON.parse(readFileSync(path, 'utf8'));
} catch {
  fail('verdict file is not valid JSON');
}

const findings = Array.isArray(verdict.findings) ? verdict.findings : [];
for (const f of findings) console.log(`${f.severity ?? 'note'}: ${f.file ?? ''}${f.line ? `:${f.line}` : ''} ${f.summary ?? ''}`);

if (verdict.verdict !== 'approve') fail(`verdict is "${verdict.verdict}" with ${findings.length} finding(s)`);
if (findings.some((f) => f.severity === 'blocker')) fail('approved with a blocker finding, which is contradictory');
const majors = findings.filter((f) => f.severity === 'major').length;
if (majors) console.log(`::notice::${name}: ${majors} major finding(s) to file as a follow-up issue.`);
console.log(`${name}: approved (${findings.length} non-blocking note(s)).`);
