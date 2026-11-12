#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

// A review receipt ties a set of approving reviews to the exact change they looked at.
//   write: after every reviewer has approved locally, records an empty commit whose message
//          carries a fingerprint of the change.
//   check: recomputes the fingerprint and fails unless a commit on the branch carries it.
// Any later edit changes the fingerprint, so the change must be reviewed again.
const REVIEWERS = ['code', 'design', 'security', 'qa'];
const base = process.env.BASE_REF ?? 'origin/main';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

// Only added and removed lines count, so the fingerprint survives main moving underneath the branch.
const fingerprint = () => {
  const lines = git('diff', '--no-color', '--no-ext-diff', '-U0', `${base}...HEAD`)
    .split('\n')
    .filter((line) => /^(\+|-|diff --git )/.test(line) && !/^(\+\+\+|---) /.test(line));
  return createHash('sha256').update(lines.join('\n')).digest('hex');
};

const mode = process.argv[2];

if (mode === 'write') {
  if (git('status', '--porcelain').trim()) {
    console.error('Commit or discard your changes first: the receipt must describe exactly what will be pushed.');
    process.exit(1);
  }
  const problems = [];
  for (const name of REVIEWERS) {
    const file = `.agent/${name}-verdict.json`;
    if (!existsSync(file)) {
      problems.push(`${name}: no verdict at ${file}`);
      continue;
    }
    try {
      const verdict = JSON.parse(readFileSync(file, 'utf8'));
      const blocking = (verdict.findings ?? []).filter((f) => f.severity === 'blocker' || f.severity === 'major');
      if (verdict.verdict !== 'approve' && verdict.verdict !== 'request_changes') problems.push(`${name}: "verdict" must be exactly "approve" or "request_changes", found ${JSON.stringify(verdict.verdict)}`);
      else if (verdict.verdict !== 'approve' || blocking.length) problems.push(`${name}: not approved (${blocking.length} blocking finding(s))`);
      if (verdict.fingerprint !== fingerprint()) problems.push(`${name}: reviewed a different version of the change; run that reviewer again`);
    } catch {
      problems.push(`${name}: verdict is not valid JSON`);
    }
  }
  if (problems.length) {
    console.error(`No receipt written:\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  const print = fingerprint();
  git('commit', '--allow-empty', '-m', `chore: review receipt\n\nReview-Receipt: sha256:${print} reviewers=${REVIEWERS.join(',')}`);
  console.log(`Receipt recorded for sha256:${print.slice(0, 12)}…`);
} else if (mode === 'check') {
  const print = fingerprint();
  const messages = git('log', `${base}..HEAD`, '--format=%B');
  if (!messages.includes(`Review-Receipt: sha256:${print}`)) {
    console.error(`::error::No review receipt matches this change (sha256:${print.slice(0, 12)}…). Run /pre-pr locally: it reviews the change and records the receipt.`);
    process.exit(1);
  }
  console.log(`Review receipt matches this change (sha256:${print.slice(0, 12)}…).`);
} else if (mode === 'fingerprint') {
  console.log(fingerprint());
} else {
  console.error('Usage: review-receipt.mjs write | check | fingerprint');
  process.exit(1);
}
