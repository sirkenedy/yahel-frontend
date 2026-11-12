#!/usr/bin/env node
// Writes each page of the built site to disk as HTML, so its content is there before any script runs.
// Runs after `vite build` (the browser's files) and `vite build --ssr` (the same pages, built to run here).
// The pages' own build is kept outside `dist`, so nothing of it can be left in the folder that is deployed.
import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(app, 'dist');
const serverBuild = join(app, 'node_modules', '.prerender');

try {
  const { renderSite } = await import(pathToFileURL(join(serverBuild, 'prerender.js')).href);
  const documents = await renderSite(await readFile(join(dist, 'index.html'), 'utf8'), { localBuild: process.env.WEBSITE_LOCAL_BUILD });
  await Promise.all(documents.map(({ file, html }) => writeFile(join(dist, file), html)));
  console.log(`Prerendered ${documents.map(({ file }) => file).join(', ')}`);
} finally {
  await rm(serverBuild, { recursive: true, force: true });
}
