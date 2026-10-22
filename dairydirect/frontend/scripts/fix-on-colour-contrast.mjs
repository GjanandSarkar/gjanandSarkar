/**
 * Codemod: replace hardcoded `text-white` with the matching on-colour token.
 *
 * `text-white` on a coloured background only ever worked in light mode, where
 * every semantic colour is dark. In dark mode those same tokens flip to light
 * tints, so white-on-primary measured 1.32:1 and white-on-error 1.70:1 --
 * both effectively invisible. Measured with a WCAG contrast script before and
 * after; see the commit message.
 *
 * Two cases are handled differently:
 *   bg-primary        -> solid brand fill, needs text-on-primary
 *   bg-primary-fixed  -> tonal CONTAINER (pale in light, dark green in dark).
 *                        White is wrong in light mode here, so it becomes
 *                        text-primary, which is legible in both themes.
 *
 * Only className strings are touched, and only when the element paints its
 * own background. `text-white` over images, gradients and scrims is correct
 * and is deliberately left alone.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry');

// Order matters: -fixed variants must be tested before the bare token.
const BG_TO_FG = [
  [/\bbg-primary-fixed(-dim)?\b/, 'text-primary'],
  [/\bbg-primary(-hover|-active|-light)?\b/, 'text-on-primary'],
  [/\bbg-secondary(-hover)?\b/, 'text-on-secondary'],
  [/\bbg-success(?!-bg)\b/, 'text-on-success'],
  [/\bbg-warning(?!-bg)\b/, 'text-on-warning'],
  [/\bbg-error(?!-bg)\b/, 'text-on-error'],
  [/\bbg-info(?!-bg)\b/, 'text-on-info'],
  // Tonal containers pair with their own strong colour, never white.
  [/\bbg-success-bg\b/, 'text-success'],
  [/\bbg-warning-bg\b/, 'text-warning'],
  [/\bbg-error-bg\b/, 'text-error'],
  [/\bbg-info-bg\b/, 'text-info'],
];

const files = execSync(
  "git ls-files 'src/app/*.tsx' 'src/app/**/*.tsx' 'src/components/*.tsx' 'src/components/**/*.tsx'",
  { encoding: 'utf8' },
).split('\n').map((f) => f.trim()).filter(Boolean);

let total = 0, touched = 0;
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  let n = 0;

  // Rewrite inside class string literals only.
  const after = before.replace(/"([^"\n]*\btext-white\b[^"\n]*)"/g, (whole, cls) => {
    for (const [bgRe, fg] of BG_TO_FG) {
      if (bgRe.test(cls)) {
        n += 1;
        return '"' + cls.replace(/\btext-white\b/g, fg) + '"';
      }
    }
    return whole; // no owned background -> leave it (overlay/gradient text)
  });

  if (n > 0) {
    total += n; touched += 1;
    console.log(String(n).padStart(4), file);
    if (!DRY) writeFileSync(file, after);
  }
}
console.log(`\n${DRY ? '[dry run] ' : ''}${total} replacements across ${touched} files (${files.length} scanned)`);
