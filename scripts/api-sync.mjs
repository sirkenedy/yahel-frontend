#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// Default: download the backend's OpenAPI description, save the snapshot, regenerate types.
// --check: regenerate from the committed snapshot and fail if the committed types differ.
const check = process.argv.includes('--check');
const specPath = 'packages/api-client/spec/openapi.json';
const typesPath = 'packages/api-client/src/schema.d.ts';
const source = process.env.API_SPEC_URL ?? 'http://localhost:3200/docs/api-json';

const sortKeys = (value) =>
  Array.isArray(value) ? value.map(sortKeys) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys(value[k])])) : value;

const before = readFileSync(typesPath, 'utf8');

if (!check) {
  const response = await fetch(source).catch(() => null);
  if (!response?.ok) {
    console.error(`Could not download the API description from ${source}. Start the backend, or set API_SPEC_URL.`);
    process.exit(1);
  }
  const previous = readFileSync(specPath, 'utf8');
  const next = `${JSON.stringify(sortKeys(await response.json()), null, 2)}\n`;
  writeFileSync(specPath, next);
  console.log(previous === next ? 'API description unchanged.' : 'API description changed; snapshot updated.');
}

execFileSync('pnpm', ['--filter', '@yahel/api-client', 'generate'], { stdio: 'inherit' });
const after = readFileSync(typesPath, 'utf8');

if (check && before !== after) {
  writeFileSync(typesPath, before);
  console.error('Generated API types are out of date with the committed snapshot. Run `pnpm api:sync` (or `pnpm --filter @yahel/api-client generate`) and commit.');
  process.exit(1);
}
console.log(before === after ? 'API types are up to date.' : 'API types regenerated; run typecheck to see what the change breaks.');
