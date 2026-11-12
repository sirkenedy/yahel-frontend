#!/usr/bin/env node
import { readFileSync } from 'node:fs';

// Agents may not change the rules that govern them. A pull request that touches these paths
// needs the "human-approved" label, which only a maintainer can apply.
// Input: a file listing changed paths, one per line (argv[2]); labels in PR_LABELS.
const protectedPaths = [/^\.github\//, /^\.claude\//, /^scripts\/agent\//, /^CLAUDE\.md$/, /^docs\/rulebook\.md$/, /^docs\/agents\.md$/, /^eslint\.config\.mjs$/, /^scripts\/check-/, /^playwright\.config\.ts$/, /^pnpm-workspace\.yaml$/];

const labels = (process.env.PR_LABELS ?? '').split(',').map((l) => l.trim());
const changed = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean);
const touched = changed.filter((file) => protectedPaths.some((p) => p.test(file)));

if (touched.length === 0) {
  console.log('No protected paths changed.');
} else if (labels.includes('human-approved')) {
  console.log(`Protected paths changed with human approval:\n- ${touched.join('\n- ')}`);
} else {
  console.error(`::error::Protected paths changed without the "human-approved" label:\n- ${touched.join('\n- ')}`);
  process.exit(1);
}
