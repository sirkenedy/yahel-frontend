#!/usr/bin/env node
// Reproduces the colour measurements behind decisions D-1, D-7 and the chart palette in docs/decisions.md.
// Colour-vision simulation: Machado, Oliveira & Fernandes (2009), severity 1.0. Distance: OKLab ΔE × 100.

const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
};
const lin = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
const oklab = ([r, g, b]) => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const sim = (rgb, m) => m.map((row) => Math.min(1, Math.max(0, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])));
const dE = (a, b) => 100 * Math.hypot(...a.map((v, i) => v - b[i]));
const normal = (a, b) => dE(oklab(lin(a)), oklab(lin(b)));
const cvd = (a, b) => Math.min(...Object.values(MACHADO).map((m) => dE(oklab(sim(lin(a), m)), oklab(sim(lin(b), m)))));
const lum = (hex) => { const [r, g, b] = lin(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

const worst = (set, fn) => {
  let best = { v: Infinity };
  const names = Object.keys(set);
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const v = fn(set[names[i]], set[names[j]]);
    if (v < best.v) best = { v, pair: `${names[i]}/${names[j]}` };
  }
  return `${best.v.toFixed(1)} (${best.pair})`;
};

const ACCENT = '#0064E0';
const others = { calendar: '#D42C23', drive: '#0A7F8A', docs: '#5146DE', sheets: '#1FA24A', slides: '#E8730A', chat: '#D62A66', meet: '#9A45D6', admin: '#4A4B55' };

console.log('D-1  Mail app hue. Thresholds: normal ΔE ≥ 15, colour-blind ΔE ≥ 8 (6 floor, with a second cue), white glyph ≥ 3:1');
console.table(
  Object.fromEntries(
    Object.entries({ 'blue (same as accent)': '#0064E0', cyan: '#0A8FC4', 'sky': '#1C8CE8', 'deep cyan': '#0B84B5', mint: '#0A9B86', brown: '#946B4E', yellow: '#F2B600' }).map(([name, hex]) => [
      name,
      {
        hex,
        'ΔE vs accent': normal(hex, ACCENT).toFixed(1),
        'CVD ΔE vs accent': cvd(hex, ACCENT).toFixed(1),
        'worst vs other apps': worst({ mail: hex, ...others }, normal),
        'worst CVD vs other apps': worst({ mail: hex, ...others }, cvd),
        'white glyph': contrast('#FFFFFF', hex).toFixed(2),
      },
    ]),
  ),
);

console.log('\nD-1b Whole app set, every pair (apps always appear together in the launcher)');
for (const [label, set] of Object.entries({
  'current (mail blue)': { mail: '#0064E0', ...others },
  'mail cyan': { mail: '#0A8FC4', ...others },
  'mail cyan + drive amber': { mail: '#0A8FC4', ...others, drive: '#B07A00' },
  'mail cyan + drive yellow': { mail: '#0A8FC4', ...others, drive: '#F2B600' },
  'mail cyan + sheets deeper green': { mail: '#0A8FC4', ...others, sheets: '#178A3E' },
  'FINAL: searched set (D-1)': { mail: '#2389E2', calendar: '#AC040C', drive: '#0C7B60', docs: '#5335CF', sheets: '#38A017', slides: '#EF6505', chat: '#D040B9', meet: '#92009C', admin: '#4A4B55' },
})) console.log(`  ${label.padEnd(34)} normal ${worst(set, normal).padEnd(26)} colour-blind ${worst(set, cvd)}`);

console.log('\nD-7  Dark base. Text contrast and how visible each surface step is (ratio between neighbouring surfaces)');
const text = { primary: '#F5F5F7', secondary: '#B4B5BF', tertiary: '#8E909B' };
console.table(
  Object.fromEntries(
    Object.entries({
      'true black #000000': ['#000000', '#000000', '#1A1B1F', '#25262B'],
      'near-black #0E0E11 (grouped #050506)': ['#0E0E11', '#050506', '#1A1B1F', '#25262B'],
      'grey #1C1C1E (grouped #121214)': ['#1C1C1E', '#121214', '#28282B', '#343438'],
    }).map(([name, [base, grouped, e1, e2]]) => [
      name,
      {
        'primary on base': contrast(text.primary, base).toFixed(1),
        'tertiary on base': contrast(text.tertiary, base).toFixed(1),
        'tertiary on elevated-2': contrast(text.tertiary, e2).toFixed(1),
        'card on grouped': contrast(e1, grouped).toFixed(2),
        'card on base': contrast(e1, base).toFixed(2),
        'elevated-2 on card': contrast(e2, e1).toFixed(2),
      },
    ]),
  ),
);
