#!/usr/bin/env node
// Writes each page of the built site to disk as HTML, so its content is there before any script runs.
// Runs after `vite build` (the browser's files) and `vite build --ssr` (the same pages, built to run here).
import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const serverBuild = join(dist, '.prerender');

const { accountLinksTo, pages, renderDocument } = await import(pathToFileURL(join(serverBuild, 'prerender.js')).href);
const template = await readFile(join(dist, 'index.html'), 'utf8');

// `/about` is written as `about.html`: the form a static host, and `vite preview`, serves at an address with no trailing slash.
const documents = await Promise.all(pages.map(async (path) => [path === '/' ? 'index.html' : `${path.slice(1)}.html`, await renderDocument(template, path)]));
await Promise.all(documents.map(([file, html]) => writeFile(join(dist, file), html)));
await rm(serverBuild, { recursive: true });

console.log(`Prerendered ${documents.map(([file]) => file).join(', ')}`);
if (!accountLinksTo.startsWith('https://')) {
  console.warn(`The pages link account actions to ${accountLinksTo}. Do not deploy this build: set VITE_APP_URL to the https address of the app and build again.`);
}
