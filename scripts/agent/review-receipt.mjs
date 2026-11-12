#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// A review receipt ties the review a change needed to the exact change that was reviewed.
//   tier:        prints which review this change needs.
//   fingerprint: prints the fingerprint of the change.
//   write:       after the reviewers for the tier have approved, records an empty commit carrying
//                the fingerprint, the tier and any follow-up issue. `write --follow-up 12`.
//   check:       recomputes fingerprint and tier and fails unless a commit on the branch carries them.
// Any later edit changes the fingerprint, so the change must be reviewed again.

// How much review a change needs is decided by what it touches, never by its author.
const FULL = [
  /^\.github\//, /^\.claude\//, /^scripts\//, /^CLAUDE\.md$/, /^docs\/rulebook\.md$/, /^docs\/agents\.md$/,
  /^eslint\.config\.mjs$/, /^playwright\.config\.ts$/, /^pnpm-workspace\.yaml$/, /^pnpm-lock\.yaml$/, /(^|\/)package\.json$/,
  /^packages\/auth\//, /^packages\/api-client\//, /^apps\/[^/]+\/src\/features\/auth\//, /^apps\/[^/]+\/src\/session\.ts$/,
  /^nx\.json$/, /^tsconfig\.base\.json$/, /(^|\/)vite\.config\.ts$/, /(^|\/)vitest\.[a-z.]*ts$/, /^\.env/,
];
const LIGHT = [/^docs\//, /^design-system\/docs\//, /^design-system\/README\.md$/, /^README\.md$/];

export const REVIEWERS = { full: ['code', 'design', 'security', 'qa'], standard: ['review'], light: [] };

export const classify = (files) => {
  if (files.length === 0) return 'light';
  if (files.some((file) => FULL.some((pattern) => pattern.test(file)))) return 'full';
  if (files.every((file) => LIGHT.some((pattern) => pattern.test(file)))) return 'light';
  return 'standard';
};

/** Checks the verdicts a tier needs. Returns the problems found and how many non-blocking majors there are. */
export const evaluate = (tier, fingerprint, readVerdict) => {
  const problems = [];
  let majors = 0;
  for (const name of REVIEWERS[tier]) {
    const raw = readVerdict(name);
    if (raw === null) {
      problems.push(`${name}: no verdict at .agent/${name}-verdict.json`);
      continue;
    }
    let verdict;
    try {
      verdict = JSON.parse(raw);
    } catch {
      problems.push(`${name}: verdict is not valid JSON`);
      continue;
    }
    const findings = Array.isArray(verdict.findings) ? verdict.findings : [];
    const blockers = findings.filter((f) => f.severity === 'blocker').length;
    majors += findings.filter((f) => f.severity === 'major').length;
    if (verdict.verdict !== 'approve' && verdict.verdict !== 'request_changes') problems.push(`${name}: "verdict" must be exactly "approve" or "request_changes", found ${JSON.stringify(verdict.verdict)}`);
    else if (verdict.verdict !== 'approve' || blockers) problems.push(`${name}: not approved (${blockers} blocker(s))`);
    if (verdict.fingerprint !== fingerprint) problems.push(`${name}: reviewed a different version of the change; run that reviewer again`);
  }
  return { problems, majors };
};

export const trailer = (fingerprint, tier, followUp) =>
  `Review-Receipt: sha256:${fingerprint} tier=${tier} reviewers=${REVIEWERS[tier].join(',') || 'none'}${followUp ? ` follow-up=#${followUp}` : ''}`;

/** True when a commit message carries a receipt for this fingerprint at a tier at least as strict as required. */
export const hasReceipt = (messages, fingerprint, required) => {
  const rank = { light: 0, standard: 1, full: 2 };
  return [...messages.matchAll(/^Review-Receipt: sha256:([0-9a-f]{64}) tier=(light|standard|full)\b/gm)].some(([, print, tier]) => print === fingerprint && rank[tier] >= rank[required]);
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const base = process.env.BASE_REF ?? 'origin/main';
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  // Only added and removed lines count, so the fingerprint survives main moving underneath the branch.
  const fingerprint = () => {
    const lines = git('diff', '--no-color', '--no-ext-diff', '-U0', `${base}...HEAD`)
      .split('\n')
      .filter((line) => /^(\+|-|diff --git )/.test(line) && !/^(\+\+\+|---) /.test(line));
    return createHash('sha256').update(lines.join('\n')).digest('hex');
  };
  const tier = () => classify(git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean));
  const [mode, ...rest] = process.argv.slice(2);

  if (mode === 'tier') {
    const t = tier();
    console.log(`${t}: ${REVIEWERS[t].length ? `reviewers ${REVIEWERS[t].join(', ')}` : 'no reviewers; CI checks only'}`);
  } else if (mode === 'fingerprint') {
    console.log(fingerprint());
  } else if (mode === 'write') {
    if (git('status', '--porcelain').trim()) {
      console.error('Commit or discard your changes first: the receipt must describe exactly what will be pushed.');
      process.exit(1);
    }
    const print = fingerprint();
    const t = tier();
    const followUp = rest[0] === '--follow-up' ? rest[1] : undefined;
    const { problems, majors } = evaluate(t, print, (name) => (existsSync(`.agent/${name}-verdict.json`) ? readFileSync(`.agent/${name}-verdict.json`, 'utf8') : null));
    if (followUp !== undefined && !/^\d+$/.test(followUp)) problems.push('--follow-up takes an issue number');
    if (majors > 0 && followUp === undefined) problems.push(`${majors} major finding(s) need a follow-up issue: file one listing them, then run write --follow-up <issue number>`);
    if (problems.length) {
      console.error(`No receipt written (tier: ${t}):\n- ${problems.join('\n- ')}`);
      process.exit(1);
    }
    git('commit', '--allow-empty', '-m', `chore: review receipt\n\n${trailer(print, t, followUp)}`);
    console.log(`Receipt recorded: tier ${t}, sha256:${print.slice(0, 12)}…${followUp ? `, follow-up #${followUp}` : ''}`);
  } else if (mode === 'check') {
    const print = fingerprint();
    const t = tier();
    if (!hasReceipt(git('log', `${base}..HEAD`, '--format=%B'), print, t)) {
      console.error(`::error::No review receipt for this change (tier ${t}, sha256:${print.slice(0, 12)}…). Run /pre-pr locally: it reviews the change and records the receipt.`);
      process.exit(1);
    }
    console.log(`Review receipt matches this change (tier ${t}, sha256:${print.slice(0, 12)}…).`);
  } else {
    console.error('Usage: review-receipt.mjs tier | fingerprint | write [--follow-up <issue>] | check');
    process.exit(1);
  }
}
