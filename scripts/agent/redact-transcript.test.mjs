import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MARK, redact } from './redact-transcript.mjs';

// Fake credentials are assembled at run time so that no credential-shaped text sits in the repository,
// where the secret scanner would rightly flag it.
const fake = (...parts) => parts.join('');
const token = fake('ghx', '_Fake0Fake1Fake2Fake3Fake4Fake5Fake6Fake7');
const letters = 'abcdefghijklmnopqrstuvwxyz';
const keyLine = (kind, edge) => fake('-----', edge, ' ', kind, 'PRIVATE', ' KEY-----');
const clean = (text, values = [token]) => redact(text, values).text;
const gone = (text) => assert.ok(!text.includes(token) && !text.includes('Fake0Fake1'), `value survived in: ${text}`);

test('removes a known value in plain, URL-encoded and JSON-escaped form', () => {
  const special = 'p@ss"word/with\\specials+1';
  const out = clean(`a=${special} b=${encodeURIComponent(special)} c=${JSON.stringify(special)}`, [special]);
  assert.equal(out, `a=${MARK} b=${MARK} c="${MARK}"`);
});

test('removes a known value from base64 at every alignment, including inside a larger blob', () => {
  for (const prefix of ['', 'A', 'AB', 'HOME=/root\nGH_TOKEN=', 'x-access-token:']) {
    const blob = Buffer.from(`${prefix}${token}\nPATH=/usr/bin`).toString('base64');
    const out = clean(`dump ${blob} end`);
    const decoded = out.replaceAll(MARK, 'AAAA').split(' ').map((part) => Buffer.from(part, 'base64').toString('latin1')).join(' ');
    assert.ok(out.includes(MARK), `nothing redacted for prefix ${JSON.stringify(prefix)}`);
    assert.ok(!decoded.includes(token.slice(4, -4)), `token recoverable for prefix ${JSON.stringify(prefix)}`);
  }
});

test('removes a known value from base64 that the encoder wrapped across lines', () => {
  const blob = Buffer.from(`HOME=/root\nGH_TOKEN=${token}\nPATH=/usr/local/bin:/usr/bin:/bin\nLANG=C.UTF-8`).toString('base64');
  for (const width of [76, 64, 20]) {
    const wrapped = blob.match(new RegExp(`.{1,${width}}`, 'g'));
    for (const joiner of ['\n', '\\n', '\r\n']) {
      const out = clean(wrapped.join(joiner));
      const decoded = Buffer.from(out.replaceAll(MARK, 'AAAA').replace(/\\[nr]|\s/g, ''), 'base64').toString('latin1');
      assert.ok(out.includes(MARK), `nothing redacted at width ${width} joined by ${JSON.stringify(joiner)}`);
      assert.ok(!decoded.includes(token.slice(4, -4)), `token recoverable at width ${width} joined by ${JSON.stringify(joiner)}`);
    }
  }
});

test('removes a known value from hex grouped the way dump tools print it', () => {
  const hex = Buffer.from(token).toString('hex');
  for (const grouped of [hex.match(/.{2}/g).join(' '), hex.match(/.{4}/g).join(' '), hex.match(/.{1,32}/g).join('\n')]) {
    assert.equal(clean(`x ${grouped} y`), `x ${MARK} y`);
  }
});

test('removes a known value in url-safe base64, hex in either case, and reversed', () => {
  gone(clean(Buffer.from(`??>>${token}`).toString('base64url')));
  for (const text of [Buffer.from(token).toString('hex'), Buffer.from(token).toString('hex').toUpperCase(), [...token].reverse().join('')]) {
    assert.equal(clean(`x ${text} y`), `x ${MARK} y`);
  }
});

test('removes a known value split by whitespace, escaped newlines or colour codes', () => {
  const half = Math.floor(token.length / 2);
  for (const split of ['\n', ' ', '\\n', '\u001b[31m']) gone(clean(`${token.slice(0, half)}${split}${token.slice(half)}`));
});

test('removes credential shapes it was never told about', () => {
  const cases = [
    fake('gh', 'p_', letters, '0123456789'),
    fake('github', '_pat_', '11AAAAAAA0', letters.slice(0, 16)),
    fake('sk', '-ant-', 'oat01-', letters),
    fake('np', 'm_', letters, '0123456789'),
    fake('xo', 'xb-', '1234567890-', letters.slice(0, 10)),
    fake('AK', 'IA', 'IOSFODNN7EXAMPLE'),
    [fake('ey', 'J', 'hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), fake('ey', 'J', 'zdWIiOiIxMjM0NTY3ODkwIn0'), 'SflKxwRJSMeKKF2QT4fwpMeJf36P'].join('.'),
  ];
  for (const secret of cases) assert.equal(redact(`before ${secret} after`, []).text, `before ${MARK} after`);
});

test('removes credentials from headers, URLs and key blocks, keeping the surrounding text', () => {
  const opaque = letters.slice(0, 24);
  assert.equal(redact(fake('Authorization', ': Bearer ', opaque), []).text, `Authorization: Bearer ${MARK}`);
  assert.equal(redact(fake('{"Authorization"', ':"Bearer ', opaque, '"}'), []).text, `{"Authorization":"Bearer ${MARK}"}`);
  assert.equal(redact(fake('{\\"authorization\\"', ': \\"basic ', opaque, '\\"}'), []).text, `{\\"authorization\\": \\"basic ${MARK}\\"}`);
  assert.equal(redact(fake('https://x-access-token', ':', 'notarealvalue', '@github.com/a/b'), []).text, `https://x-access-token:${MARK}@github.com/a/b`);
  assert.equal(redact(`${keyLine('RSA ', 'BEGIN')}\nMIIabc\n${keyLine('RSA ', 'END')}`, []).text, MARK);
  assert.equal(redact(`key: ${keyLine('', 'BEGIN')}\nMIIabc (cut off)`, []).text, `key: ${MARK}`);
});

test('a key block with no END line does not swallow the rest of the transcript', () => {
  const transcript = JSON.stringify([{ content: `pem: ${keyLine('', 'BEGIN')}\nMIIabc` }, { content: 'later output that must survive' }]);
  const { text } = redact(transcript, []);
  const parsed = JSON.parse(text);
  assert.equal(parsed[0].content, `pem: ${MARK}`);
  assert.equal(parsed[1].content, 'later output that must survive');
});

test('leaves ordinary transcript content and JSON structure intact', () => {
  const transcript = JSON.stringify([{ type: 'tool_result', content: 'pnpm verify\n61 passed', sha: 'e9a56b9a259e8bbd1dff142040352e308dd049a845ba7fca141041eadb66192f' }]);
  const { text, hits } = redact(transcript, [token]);
  assert.equal(text, transcript);
  assert.equal(hits, 0);
  assert.doesNotThrow(() => JSON.parse(redact(JSON.stringify({ out: `GH_TOKEN=${token}` }), [token]).text));
});

test('ignores empty and very short values rather than shredding the transcript', () => {
  assert.equal(redact('the cat sat', ['', 'cat', undefined]).text, 'the cat sat');
});
