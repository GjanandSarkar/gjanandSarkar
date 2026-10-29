/**
 * Replace hardcoded hex colours and gray-* utilities with theme tokens.
 *
 * Dark mode stayed unreadable after the earlier sweeps because those only
 * covered named Tailwind palettes (emerald/amber/rose/slate/...). 208 raw
 * hex literals and 42 gray-* utilities across 50 files were never touched,
 * so they kept their light-mode value in dark mode. The worst are dark
 * green TEXT (#0d3b24 on a near-black background) and near-white
 * BACKGROUNDS (#f3f5f0 under light foreground text) -- both unreadable.
 *
 * Mapped by semantic role, not by appearance:
 *   brass/gold  -> secondary        greens        -> primary family
 *   creams      -> surfaces         warm greys    -> border / muted
 *
 * WhatsApp's brand green is deliberately NOT mapped: it identifies a third
 * party and must not shift with our theme.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry');

// Third-party brand colours: never themed.
const KEEP = new Set(['#25D366', '#20bd5a']);

// hex -> token suffix (prefix such as bg-/text-/border- is preserved)
const HEX = {
  // ── brass / gold → secondary ──────────────────────────────────────────
  '#c88a23': 'secondary',
  '#b87d20': 'secondary',
  '#b0781c': 'secondary-hover',
  '#ad7418': 'secondary-hover',
  '#925f0e': 'secondary-hover',
  '#5b4300': 'secondary-hover',
  '#f0d9a0': 'secondary-bg',
  '#fff8e6': 'secondary-bg',

  // ── deep greens → primary ─────────────────────────────────────────────
  '#0c3c26': 'primary',
  '#0d3b24': 'primary',
  '#0c331f': 'primary',
  '#0b331f': 'primary',
  '#143427': 'primary',
  '#124227': 'primary',
  '#10351f': 'primary',
  '#22533e': 'primary',
  '#1b4332': 'primary',
  '#0a2c1b': 'primary-fixed-dim',
  '#092b1b': 'primary-fixed-dim',
  '#082615': 'primary-fixed-dim',
  '#072617': 'primary-fixed-dim',
  '#072415': 'primary-fixed-dim',

  // ── mid greens → primary-light / hover ────────────────────────────────
  '#114e32': 'primary-hover',
  '#165a37': 'primary-light',
  '#165a38': 'primary-light',
  '#165b3b': 'primary-light',
  '#175c3a': 'primary-light',
  '#1b5e39': 'primary-light',
  '#2d6a4f': 'primary-light',
  '#065f46': 'primary-light',
  '#4a8c3f': 'primary-light',
  // Olive: explicitly retired from the palette, folded into the greens.
  '#3f6530': 'primary-light',
  '#4b6a41': 'primary-light',
  '#4a5c43': 'foreground-muted',
  '#606f7b': 'foreground-muted',

  // ── pale greens → tonal container ─────────────────────────────────────
  '#bfe0cc': 'primary-fixed',
  '#eaf6ef': 'success-bg',
  '#f0f4ec': 'primary-fixed',

  // ── creams / neutrals → surfaces ──────────────────────────────────────
  '#fdfdfc': 'surface',
  '#faf9f6': 'background',
  '#fbf8f2': 'background',
  '#f7f1e5': 'surface-muted',
  '#f4ebe0': 'surface-muted',
  '#f2ede4': 'surface-muted',
  '#f3f5f0': 'surface-muted',
  '#eeeee7': 'surface-muted',
  '#e9dfd0': 'border',
  '#d8d4c9': 'border',
};

// gray-* → tokens, by role
const GRAY = {
  'bg-gray-900': 'bg-primary', 'bg-gray-800': 'bg-primary-hover',
  'bg-gray-300': 'bg-border', 'bg-gray-200': 'bg-border',
  'bg-gray-100': 'bg-surface-muted', 'bg-gray-50': 'bg-surface-muted',
  'text-gray-900': 'text-foreground', 'text-gray-800': 'text-foreground',
  'text-gray-700': 'text-foreground', 'text-gray-600': 'text-foreground-muted',
  'text-gray-500': 'text-foreground-muted', 'text-gray-400': 'text-foreground-muted',
  'text-gray-300': 'text-foreground-muted',
  'border-gray-900': 'border-primary', 'border-gray-700': 'border-border-hover',
  'border-gray-500': 'border-border-hover', 'border-gray-400': 'border-border-hover',
  'border-gray-300': 'border-border', 'border-gray-200': 'border-border',
  'border-gray-100': 'border-border',
  'divide-gray-50': 'divide-border', 'divide-gray-100': 'divide-border',
  'placeholder-gray-400': 'placeholder-foreground-muted',
  'placeholder-gray-500': 'placeholder-foreground-muted',
};

const files = execSync(
  "git ls-files 'src/**/*.tsx' 'src/**/*.ts'", { encoding: 'utf8' }
).split('\n').map((f) => f.trim()).filter(Boolean);

let hexCount = 0, grayCount = 0, touched = 0;
const unmapped = new Map();

for (const file of files) {
  const before = readFileSync(file, 'utf8');
  let out = before;

  // utility-[#hex]  ->  utility-token
  out = out.replace(/\b([a-z-]+)-\[(#[0-9a-fA-F]{3,8})\]/g, (whole, prefix, hex) => {
    if (KEEP.has(hex)) return whole;
    const token = HEX[hex.toLowerCase()] ?? HEX[hex];
    if (!token) {
      unmapped.set(hex, (unmapped.get(hex) ?? 0) + 1);
      return whole;
    }
    hexCount += 1;
    return `${prefix}-${token}`;
  });

  for (const [from, to] of Object.entries(GRAY)) {
    const re = new RegExp(`\\b${from}\\b`, 'g');
    const hits = out.match(re);
    if (hits) { grayCount += hits.length; out = out.replace(re, to); }
  }

  if (out !== before) {
    touched += 1;
    if (!DRY) writeFileSync(file, out);
  }
}

console.log(`${DRY ? '[dry] ' : ''}${hexCount} hex + ${grayCount} gray replaced across ${touched} files`);
if (unmapped.size) {
  console.log('\nUNMAPPED (left alone):');
  for (const [hex, n] of [...unmapped].sort((a, b) => b[1] - a[1])) console.log(`  ${hex}  x${n}`);
}
