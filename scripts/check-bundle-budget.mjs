#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

// Budgets are gzip kilobytes per app. Raising one needs a line in docs/decisions.md saying why.
const budgets = { shell: { entryJs: 120, totalJs: 220, css: 12 } };
const errors = [];

for (const [app, budget] of Object.entries(budgets)) {
  const dir = join('apps', app, 'dist', 'assets');
  const sizes = Object.fromEntries(readdirSync(dir).map((f) => [f, gzipSync(readFileSync(join(dir, f))).length / 1024]));
  const js = Object.entries(sizes).filter(([f]) => f.endsWith('.js'));
  const entry = Math.max(...js.filter(([f]) => f.startsWith('index-')).map(([, kb]) => kb));
  const totalJs = js.reduce((sum, [, kb]) => sum + kb, 0);
  const css = Object.entries(sizes).filter(([f]) => f.endsWith('.css')).reduce((sum, [, kb]) => sum + kb, 0);
  const report = { entryJs: entry, totalJs, css };
  for (const [key, limit] of Object.entries(budget)) {
    const line = `${app} ${key}: ${report[key].toFixed(1)} kB gzip (budget ${limit})`;
    console.log(line);
    if (report[key] > limit) errors.push(line);
  }
}

if (errors.length) {
  console.error(`Bundle budget exceeded:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
