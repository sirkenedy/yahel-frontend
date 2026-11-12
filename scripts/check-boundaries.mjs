#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

// Which kinds of package may depend on which. See docs/architecture.md §2.
const allowed = {
  'type:app': ['type:ui', 'type:data', 'type:tokens'],
  'type:ui': ['type:tokens'],
  'type:data': ['type:data'],
  'type:tokens': [],
};

const projects = ['apps', 'packages']
  .flatMap((root) => readdirSync(root).map((name) => join(root, name)))
  .filter((dir) => existsSync(join(dir, 'package.json')))
  .map((dir) => {
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    return { dir, name: manifest.name, tag: manifest.nx?.tags?.[0], deps: Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }) };
  });
const byName = new Map(projects.map((p) => [p.name, p]));
const errors = [];

const sourceFiles = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (entry === 'node_modules' || entry === 'dist') return [];
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(ts|tsx|css)$/.test(entry) ? [path] : [];
  });

for (const project of projects) {
  if (!allowed[project.tag]) {
    errors.push(`${project.name}: package.json needs "nx": { "tags": ["type:app" | "type:ui" | "type:data" | "type:tokens"] }`);
    continue;
  }
  for (const dep of project.deps.filter((d) => byName.has(d))) {
    const target = byName.get(dep);
    if (!allowed[project.tag].includes(target.tag)) errors.push(`${project.name} (${project.tag}) may not depend on ${dep} (${target.tag})`);
  }
  const src = join(project.dir, 'src');
  if (!existsSync(src)) continue;
  for (const file of sourceFiles(src)) {
    const text = readFileSync(file, 'utf8');
    for (const [, spec] of text.matchAll(/(?:from\s+|import\s+|@import\s+)['"]([^'"]+)['"]/g)) {
      if (spec.startsWith('.')) {
        const target = resolve(file, '..', spec);
        if (relative(resolve(project.dir), target).startsWith(`..${sep}`)) errors.push(`${file}: relative import "${spec}" leaves its package; import the package by name`);
        continue;
      }
      const match = spec.match(/^@yahel\/[^/]+/);
      if (!match) continue;
      if (!byName.has(match[0])) errors.push(`${file}: imports unknown workspace package ${match[0]}`);
      else if (match[0] !== project.name && !project.deps.includes(match[0])) errors.push(`${file}: imports ${match[0]} but ${project.name} does not declare it as a dependency`);
      if (/^@yahel\/[^/]+\/src(\/|$)/.test(spec)) errors.push(`${file}: deep import "${spec}"; use the package's public entry point`);
    }
  }
}

if (errors.length) {
  console.error(`Boundary check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Boundaries OK: ${projects.length} projects, no forbidden dependencies or deep imports.`);
