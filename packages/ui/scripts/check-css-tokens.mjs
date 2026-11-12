#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const defined = new Set(readFileSync(join(pkg, '..', 'tokens', 'dist', 'tokens.css'), 'utf8').match(/--ws-[a-z0-9-]+(?=:)/g));
const dir = join(pkg, 'src', 'styles');
const errors = [];

for (const file of readdirSync(dir).filter((f) => f.endsWith('.css'))) {
  const css = readFileSync(join(dir, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/url\("data:[^"]*"\)/g, '');
  for (const name of new Set(css.match(/--ws-[a-z0-9-]+/g) ?? [])) {
    if (!defined.has(name)) errors.push(`${file}: unknown token ${name}`);
  }
  for (const raw of new Set(css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g) ?? [])) {
    errors.push(`${file}: raw colour ${raw}; use a token`);
  }
}

if (errors.length) {
  console.error(`Component CSS check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Component CSS OK: every colour is a token and every token exists (${defined.size} defined).`);
