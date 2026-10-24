/**
 * One-off codemod: convert hardcoded colours in the admin and seller panels to
 * the themed design tokens introduced by the UI/UX work.
 *
 * Why this exists
 * ---------------
 * The customer surfaces were converted to tokens, and the admin *shell*
 * (layout, sidebar) was too — but the admin and seller *pages* were not. That
 * left those panels in a half-converted state that is worse than either
 * extreme: in dark mode the shell turns dark while page content stays white
 * with near-black text, so staff screens become unreadable.
 *
 * Only structural colours are rewritten (page/card backgrounds, body text,
 * borders) plus the old brand greens. Deliberately NOT touched:
 *
 *  - `text-white` paired with a brand background. `--on-primary` is white in
 *    both themes, so these are already correct and rewriting them risks
 *    inverting legible buttons.
 *  - Chart series colours, which are a fixed qualitative palette and must stay
 *    distinguishable rather than theme-aware.
 *  - Legacy aliases such as `text-dark` / `border-sand` / `bg-cream`, which the
 *    theme layer already maps onto the new tokens, so they adapt for free.
 *
 * Run from the frontend directory:  node scripts/tokenise-theme.mjs [--dry]
 */

import { readFileSync, writeFileSync } from 'node:fs';

import { execSync } from 'node:child_process';

const DRY = process.argv.includes('--dry');

/**
 * Ordered replacement rules. Order matters: longer and more specific patterns
 * must run before shorter ones, or a prefix match corrupts the longer token
 * (for example `gray-50` would otherwise match inside `gray-500`).
 */
const RULES = [
  // ── Old brand greens → primary ────────────────────────────────────────────
  [/#0c3c26/gi, 'var(--primary)'],
  [/#0f3e26/gi, 'var(--primary)'],
  [/#114e32/gi, 'var(--primary-hover)'],
  [/#144f31/gi, 'var(--primary-hover)'],

  // ── Old neutral palette → themed neutrals ────────────────────────────────
  [/#fafaf8/gi, 'var(--background)'],
  [/#1c201e/gi, 'var(--foreground)'],
  [/#8a948e/gi, 'var(--foreground-muted)'],
  [/#58625c/gi, 'var(--foreground-muted)'],
  [/#e4e2db/gi, 'var(--border)'],
  [/#e6f2ec/gi, 'var(--primary-fixed)'],

  // ── Arbitrary-value utilities now holding a var() → real token utilities ──
  // `bg-[var(--primary)]` is valid but verbose; collapse to `bg-primary`.
  [/\bbg-\[var\(--primary\)\]/g, 'bg-primary'],
  [/\btext-\[var\(--primary\)\]/g, 'text-primary'],
  [/\bborder-\[var\(--primary\)\]/g, 'border-primary'],
  [/\bbg-\[var\(--primary-hover\)\]/g, 'bg-primary-hover'],
  [/\bbg-\[var\(--background\)\]/g, 'bg-background'],
  [/\bbg-\[var\(--primary-fixed\)\]/g, 'bg-primary-fixed'],
  [/\btext-\[var\(--foreground\)\]/g, 'text-foreground'],
  [/\btext-\[var\(--foreground-muted\)\]/g, 'text-foreground-muted'],
  [/\bborder-\[var\(--border\)\]/g, 'border-border'],

  // ── Surfaces ──────────────────────────────────────────────────────────────
  [/\bbg-white\b/g, 'bg-surface'],
  [/\bbg-gray-50\b/g, 'bg-surface-muted'],
  [/\bbg-gray-100\b/g, 'bg-surface-muted'],
  [/\bbg-gray-200\b/g, 'bg-border'],
  [/\bbg-slate-50\b/g, 'bg-surface-muted'],
  [/\bbg-slate-100\b/g, 'bg-surface-muted'],

  // ── Body text. 700 and darker is primary text; 600 and lighter is muted. ──
  [/\btext-gray-900\b/g, 'text-foreground'],
  [/\btext-gray-800\b/g, 'text-foreground'],
  [/\btext-gray-700\b/g, 'text-foreground'],
  [/\btext-gray-600\b/g, 'text-foreground-muted'],
  [/\btext-gray-500\b/g, 'text-foreground-muted'],
  [/\btext-gray-400\b/g, 'text-foreground-muted'],
  [/\btext-gray-300\b/g, 'text-foreground-muted'],
  [/\btext-slate-900\b/g, 'text-foreground'],
  [/\btext-slate-700\b/g, 'text-foreground'],
  [/\btext-slate-600\b/g, 'text-foreground-muted'],
  [/\btext-slate-500\b/g, 'text-foreground-muted'],

  // ── Borders and dividers ─────────────────────────────────────────────────
  [/\bborder-gray-100\b/g, 'border-border'],
  [/\bborder-gray-200\b/g, 'border-border'],
  [/\bborder-gray-300\b/g, 'border-border-hover'],
  [/\bborder-slate-200\b/g, 'border-border'],
  [/\bdivide-gray-100\b/g, 'divide-border'],
  [/\bdivide-gray-200\b/g, 'divide-border'],

  // ── Status chips → semantic tokens, which carry their own dark values ────
  // Light-tinted chips on a dark surface look wrong and lose contrast; the
  // semantic pairs invert properly instead.
  [/\bbg-emerald-50\b/g, 'bg-success-bg'],
  [/\bbg-emerald-100\b/g, 'bg-success-bg'],
  [/\bbg-green-50\b/g, 'bg-success-bg'],
  [/\bbg-green-100\b/g, 'bg-success-bg'],
  [/\btext-emerald-600\b/g, 'text-success'],
  [/\btext-emerald-700\b/g, 'text-success'],
  [/\btext-green-600\b/g, 'text-success'],
  [/\btext-green-700\b/g, 'text-success'],
  [/\bborder-emerald-200\b/g, 'border-success/20'],
  [/\bborder-green-200\b/g, 'border-success/20'],

  [/\bbg-amber-50\b/g, 'bg-warning-bg'],
  [/\bbg-amber-100\b/g, 'bg-warning-bg'],
  [/\bbg-yellow-50\b/g, 'bg-warning-bg'],
  [/\bbg-yellow-100\b/g, 'bg-warning-bg'],
  [/\btext-amber-600\b/g, 'text-warning'],
  [/\btext-amber-700\b/g, 'text-warning'],
  [/\btext-yellow-700\b/g, 'text-warning'],
  [/\bborder-amber-200\b/g, 'border-warning/20'],

  [/\bbg-red-50\b/g, 'bg-error-bg'],
  [/\bbg-red-100\b/g, 'bg-error-bg'],
  [/\bbg-rose-50\b/g, 'bg-error-bg'],
  [/\bbg-rose-100\b/g, 'bg-error-bg'],
  [/\btext-red-600\b/g, 'text-error'],
  [/\btext-red-700\b/g, 'text-error'],
  [/\btext-red-800\b/g, 'text-error'],
  [/\btext-rose-600\b/g, 'text-error'],
  [/\btext-rose-700\b/g, 'text-error'],
  [/\bborder-red-200\b/g, 'border-error/20'],
  [/\bborder-rose-200\b/g, 'border-error/20'],

  [/\bbg-blue-50\b/g, 'bg-info-bg'],
  [/\bbg-blue-100\b/g, 'bg-info-bg'],
  [/\bbg-sky-50\b/g, 'bg-info-bg'],
  [/\bbg-sky-100\b/g, 'bg-info-bg'],
  [/\btext-blue-600\b/g, 'text-info'],
  [/\btext-blue-700\b/g, 'text-info'],
  [/\btext-sky-600\b/g, 'text-info'],
  [/\bborder-blue-200\b/g, 'border-info/20'],
];

const files = execSync(
  "git ls-files 'src/app/*.tsx' 'src/app/**/*.tsx' " +
    "'src/components/*.tsx' 'src/components/**/*.tsx'",
  { encoding: 'utf8' }
)
  .split('\n')
  .filter(Boolean)
  // The chart palette is intentionally fixed; see the header note.
  .filter((f) => !f.endsWith('components/admin/charts.tsx'));

let changedFiles = 0;
let totalEdits = 0;

for (const file of files) {
  const before = readFileSync(file, 'utf8');
  let after = before;
  let edits = 0;

  for (const [pattern, replacement] of RULES) {
    after = after.replace(pattern, () => {
      edits++;
      return replacement;
    });
  }

  if (edits > 0) {
    changedFiles++;
    totalEdits += edits;
    if (!DRY) writeFileSync(file, after);
    console.log(`${String(edits).padStart(4)}  ${file}`);
  }
}

console.log(
  `\n${DRY ? '[dry run] ' : ''}${totalEdits} replacements across ${changedFiles} files (${files.length} scanned)`
);
