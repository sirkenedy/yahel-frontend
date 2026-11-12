import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classify, evaluate, hasReceipt, trailer } from './review-receipt.mjs';

const print = 'a'.repeat(64);
const verdicts = (map) => (name) => (name in map ? JSON.stringify(map[name]) : null);
const ok = (findings = []) => ({ fingerprint: print, verdict: 'approve', findings });

test('anything touching sign-in, the API client, dependencies, tooling or the rules needs full review', () => {
  for (const file of ['packages/auth/src/session.ts', 'packages/api-client/src/client.ts', 'apps/shell/src/features/auth/sign-in-form.tsx', 'apps/shell/src/session.ts', 'package.json', 'packages/ui/package.json', 'pnpm-lock.yaml', '.github/workflows/ci.yml', '.claude/agents/qa.md', 'scripts/check-boundaries.mjs', 'docs/rulebook.md', 'CLAUDE.md', 'eslint.config.mjs', 'apps/shell/vite.config.ts']) {
    assert.equal(classify(['apps/shell/src/app.css', file]), 'full', file);
  }
});

test('documentation alone needs no reviewers; any code beside it does', () => {
  assert.equal(classify(['docs/roadmap.md', 'design-system/docs/components/button.md', 'README.md']), 'light');
  assert.equal(classify(['docs/roadmap.md', 'apps/shell/src/features/account/account.tsx']), 'standard');
  assert.equal(classify(['docs/agents.md']), 'full');
  assert.equal(classify([]), 'light');
});

test('ordinary feature work gets the single combined review', () => {
  assert.equal(classify(['apps/shell/src/features/account/account.tsx', 'packages/ui/src/components/button.tsx', 'e2e/account.spec.ts', 'packages/ui/src/styles/components.css']), 'standard');
});

test('a tier is satisfied only by approvals of this exact version from each of its reviewers', () => {
  assert.deepEqual(evaluate('standard', print, verdicts({ review: ok() })), { problems: [], majors: 0 });
  assert.equal(evaluate('full', print, verdicts({ code: ok(), design: ok(), security: ok() })).problems.length, 1);
  assert.match(evaluate('standard', print, verdicts({ review: { ...ok(), fingerprint: 'b'.repeat(64) } })).problems[0], /different version/);
  assert.match(evaluate('standard', print, verdicts({ review: { ...ok(), verdict: 'approved' } })).problems[0], /exactly/);
  assert.match(evaluate('standard', print, verdicts({ review: { ...ok(), verdict: 'request_changes' } })).problems[0], /not approved/);
  assert.match(evaluate('standard', print, () => '{broken').problems[0], /not valid JSON/);
  assert.deepEqual(evaluate('light', print, verdicts({})), { problems: [], majors: 0 });
});

test('a blocker always stops the receipt; majors are counted, not blocking', () => {
  assert.match(evaluate('standard', print, verdicts({ review: ok([{ severity: 'blocker' }]) })).problems[0], /1 blocker/);
  assert.deepEqual(evaluate('standard', print, verdicts({ review: ok([{ severity: 'major' }, { severity: 'major' }, { severity: 'note' }]) })), { problems: [], majors: 2 });
});

test('a receipt counts only for the same change, at the required tier or stricter', () => {
  const log = `chore: review receipt\n\n${trailer(print, 'standard', '12')}\n`;
  assert.ok(hasReceipt(log, print, 'standard'));
  assert.ok(hasReceipt(log, print, 'light'));
  assert.ok(!hasReceipt(log, print, 'full'));
  assert.ok(!hasReceipt(log, 'c'.repeat(64), 'standard'));
  assert.ok(!hasReceipt(`mentions Review-Receipt: sha256:${print} tier=full in prose`, print, 'full'));
  assert.match(trailer(print, 'light'), /tier=light reviewers=none$/);
  assert.match(trailer(print, 'full', '7'), /reviewers=code,design,security,qa follow-up=#7$/);
});
