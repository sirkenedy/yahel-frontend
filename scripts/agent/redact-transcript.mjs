#!/usr/bin/env node
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Usage: redact-transcript.mjs <input> <output>
// Copies an agent transcript with credentials removed, so it can be published as an artifact.
// Known values come from environment variables named REDACT_*.
export const MARK = '[REDACTED]';

// The part of a base64 encoding that does not depend on neighbouring bytes, for each of the
// three alignments a value can have inside a larger encoded blob (such as an encoded env dump).
const base64Cores = (value) => {
  const cores = [];
  for (let pad = 0; pad < 3; pad++) {
    const bytes = Buffer.concat([Buffer.alloc(pad), Buffer.from(value)]);
    const encoded = bytes.toString('base64').replace(/=+$/, '');
    const start = [0, 2, 3][pad];
    const end = bytes.length % 3 === 0 ? encoded.length : encoded.length - 1;
    const core = encoded.slice(start, end);
    cores.push(core, core.replaceAll('+', '-').replaceAll('/', '_'));
  }
  return cores;
};

export const forms = (value) => {
  const hex = Buffer.from(value).toString('hex');
  const all = [value, encodeURIComponent(value), JSON.stringify(value).slice(1, -1), [...value].reverse().join(''), hex, hex.toUpperCase(), ...base64Cores(value)];
  return [...new Set(all)].filter((form) => form.length >= 8).sort((a, b) => b.length - a.length);
};

export const patterns = [
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /sk-ant-[A-Za-z0-9_-]{20,}/g,
  /npm_[A-Za-z0-9]{30,}/g,
  /xox[abprs]-[A-Za-z0-9-]{10,}/g,
  /A[KS]IA[0-9A-Z]{16}/g,
  /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/g,
  /(authorization\\?["']?\s*[:=]\s*\\?["']?\s*(?:bearer|basic|token)\s+)[A-Za-z0-9._~+/=-]{16,}/gi,
  /(https?:\/\/[^\s/:@"']+:)[^\s@"']{8,}(@)/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
];

export const redact = (text, values) => {
  let hits = 0;
  // Whitespace and colour codes can split a value across output; match it with those allowed between characters.
  const loose = (value) => new RegExp([...value].map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(?:\\s|\\\\n|\\\\r|\\\\t|\\x1b\\[[0-9;]*m|\\\\u001b\\[[0-9;]*m)*'), 'g');
  for (const value of values.filter((v) => v && v.length >= 8)) {
    for (const form of forms(value)) {
      const parts = text.split(form);
      hits += parts.length - 1;
      text = parts.join(MARK);
    }
    text = text.replace(loose(value), () => {
      hits += 1;
      return MARK;
    });
  }
  for (const pattern of patterns) {
    text = text.replace(pattern, (match, prefix, suffix) => {
      hits += 1;
      return typeof prefix === 'string' ? `${prefix}${MARK}${typeof suffix === 'string' ? suffix : ''}` : MARK;
    });
  }
  return { text, hits };
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error('Usage: redact-transcript.mjs <input> <output>');
    process.exit(1);
  }
  // Never leave an earlier file where the upload step would pick it up.
  rmSync(output, { force: true });
  if (!existsSync(input)) {
    console.log('No transcript to redact.');
    process.exit(0);
  }
  const values = Object.entries(process.env)
    .filter(([name]) => name.startsWith('REDACT_'))
    .map(([, value]) => value);
  try {
    const { text, hits } = redact(readFileSync(input, 'utf8'), values);
    writeFileSync(output, text);
    console.log(`Transcript redacted (${hits} replacement(s)) and saved for upload.`);
  } catch (error) {
    rmSync(output, { force: true });
    console.log(`::warning::Transcript not saved: ${error.message}`);
  }
}
