/**
 * Second-pass codemod: literal Tailwind status colours -> semantic tokens.
 *
 * The first pass (tokenise-theme.mjs) handled greys and brand greens. What it
 * left behind were the status palettes -- emerald/amber/rose/slate/indigo --
 * which are hardcoded light-theme values. They are the reason dark mode still
 * looked broken: a `bg-emerald-50` chip stays pale mint on a near-black
 * surface and its `text-emerald-800` label becomes unreadable.
 *
 * Order matters: 3-digit shades must be rewritten before 2-digit ones, or
 * `emerald-50` matches inside `emerald-500`.
 *
 * charts.tsx is excluded on purpose. Its series colours encode data identity
 * and must stay mutually distinguishable, which semantic tokens are not.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry');

/** [regex, replacement] applied in order. */
const RULES = [
  // success (greens)
  [/\b(bg|text|border)-emerald-(600|700|800|900)\b/g, '$1-success'],
  [/\b(bg|text|border)-emerald-(400|500)\b/g, '$1-success'],
  [/\b(bg|text|border)-emerald-(50|100|200)\b/g, '$1-success-bg'],
  // warning (ambers)
  [/\b(bg|text|border)-amber-(600|700|800|900)\b/g, '$1-warning'],
  [/\b(bg|text|border)-amber-(400|500)\b/g, '$1-warning'],
  [/\b(bg|text|border)-amber-(50|100|200)\b/g, '$1-warning-bg'],
  // error (roses)
  [/\b(bg|text|border)-rose-(600|700|800|900)\b/g, '$1-error'],
  [/\b(bg|text|border)-rose-(400|500)\b/g, '$1-error'],
  [/\b(bg|text|border)-rose-(50|100|200)\b/g, '$1-error-bg'],
  // info (indigo / sky)
  [/\b(bg|text|border)-(indigo|sky)-(600|700|800|900)\b/g, '$1-info'],
  [/\b(bg|text|border)-(indigo|sky)-(400|500)\b/g, '$1-info'],
  [/\b(bg|text|border)-(indigo|sky)-(50|100|200)\b/g, '$1-info-bg'],
  // neutrals (slate)
  [/\b(bg|text|border)-slate-(700|800|900)\b/g, '$1-foreground'],
  [/\b(bg|text|border)-slate-(400|500|600)\b/g, '$1-foreground-muted'],
  [/\bbg-slate-(50|100)\b/g, 'bg-surface-muted'],
  [/\btext-slate-(50|100|200|300)\b/g, 'text-foreground-muted'],
  [/\bborder-slate-(200|300)\b/g, 'border-border'],
  [/\bbg-slate-(200|300)\b/g, 'bg-border'],
];

const files = execSync(
  "git ls-files 'src/app/*.tsx' 'src/app/**/*.tsx' 'src/components/*.tsx' 'src/components/**/*.tsx'",
  { encoding: 'utf8' },
)
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean)
  .filter((f) => !f.endsWith('components/admin/charts.tsx'));

let total = 0;
let touched = 0;
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  let after = before;
  let n = 0;
  for (const [re, to] of RULES) {
    after = after.replace(re, (m) => {
      n += 1;
      return m.replace(re, to);
    });
  }
  if (n > 0) {
    total += n;
    touched += 1;
    console.log(String(n).padStart(4), file);
    if (!DRY) writeFileSync(file, after);
  }
}
console.log(`\n${DRY ? '[dry run] ' : ''}${total} replacements across ${touched} files (${files.length} scanned)`);
