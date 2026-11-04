import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');

function tokens(): Record<string, string> {
  const scss = readFileSync(join(root, 'src/scss/base/_tokens.scss'), 'utf8');
  const result: Record<string, string> = {};
  for (const [, name, value] of scss.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)) {
    if (name && value) result[name] = value;
  }
  return result;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** Every text colour on every background it is used on. [text, background] */
const TEXT_PAIRS: [string, string][] = [
  ['ink', 'paper'],
  ['ink', 'paper-shade'],
  ['ink', 'cloud'],
  ['ink', 'sand'],
  ['ink', 'marker-yellow'],
  ['ink', 'sea-light'],
  ['ink-soft', 'paper'],
  ['ink-soft', 'paper-shade'],
  ['sky-text', 'paper'],
  ['sky-text', 'paper-shade'],
  ['error-text', 'paper'],
];

describe('palette', () => {
  const palette = tokens();

  it.each(TEXT_PAIRS)('%s text on %s meets WCAG AA (4.5:1)', (text, background) => {
    const fg = palette[text];
    const bg = palette[background];
    expect(fg, `--${text} missing`).toBeDefined();
    expect(bg, `--${background} missing`).toBeDefined();
    expect(contrast(fg!, bg!)).toBeGreaterThanOrEqual(4.5);
  });

  it('focus ring (--sky-text) stands out from the paper (3:1)', () => {
    expect(contrast(palette['sky-text']!, palette.paper!)).toBeGreaterThanOrEqual(3);
  });
});

function files(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path, pattern);
    return pattern.test(name) ? [path] : [];
  });
}

describe('UI text', () => {
  it('contains no em dashes', () => {
    const sources = [
      ...files(join(root, 'src'), /\.(tsx|json|svg)$/),
      join(root, 'index.html'),
      join(root, 'public/manifest.webmanifest'),
    ];
    const offenders = sources.filter((file) => readFileSync(file, 'utf8').includes('—'));
    expect(offenders).toEqual([]);
  });
});
