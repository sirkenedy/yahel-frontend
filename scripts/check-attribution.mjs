#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

// Decision F-14: no AI attribution in commits or pull requests.
const pattern = /co-authored-by:.*(claude|anthropic|copilot|openai|\bai\b)|generated with \[?claude|noreply@anthropic\.com|🤖 generated/i;
const base = process.env.BASE_SHA;
const range = base && !/^0+$/.test(base) ? [`${base}..HEAD`] : ['HEAD'];
const log = execFileSync('git', ['log', '--format=%H%n%B%n==END==', ...range], { encoding: 'utf8' });
const errors = log
  .split('==END==')
  .map((entry) => entry.trim())
  .filter((entry) => entry && pattern.test(entry))
  .map((entry) => `commit ${entry.slice(0, 10)} carries an attribution line`);
if (pattern.test(process.env.PR_BODY ?? '')) errors.push('the pull request description carries an attribution line');

if (errors.length) {
  console.error(`Attribution check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('No attribution lines found.');
