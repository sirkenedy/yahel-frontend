#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(pkg, '..', '..');
const defined = new Set(readFileSync(join(pkg, '..', 'tokens', 'dist', 'tokens.css'), 'utf8').match(/--ws-[a-z0-9-]+(?=:)/g));
const errors = [];

const cssFiles = (dir) =>
  !existsSync(dir)
    ? []
    : readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry);
        return statSync(path).isDirectory() ? cssFiles(path) : entry.endsWith('.css') ? [path] : [];
      });

// The component layer, and every app's own CSS: an app may not carry a raw colour either.
const apps = join(repo, 'apps');
const files = [...cssFiles(join(pkg, 'src', 'styles')), ...readdirSync(apps).flatMap((app) => cssFiles(join(apps, app, 'src')))];

for (const path of files) {
  const file = relative(repo, path);
  const css = readFileSync(path, 'utf8')
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
console.log(`Component CSS OK: ${files.length} files, every colour is a token and every token exists (${defined.size} defined).`);
