import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { appName } from './app';

// Golden rule: colours come only from the tokens in src/app.css.
const src = fileURLToPath(new URL('..', import.meta.url));
const TOKEN_OWNER = 'app.css';
const RAW_COLOUR =
  /(?<![{\w&])#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|light-dark)\(/i;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(svelte|ts|js|css|html)$/.test(entry.name) &&
      !entry.name.endsWith('.test.ts')
      ? [path]
      : [];
  });
}

describe('theme tokens', () => {
  it('keeps raw colours out of every file except src/app.css', () => {
    const offenders = sourceFiles(src)
      .filter((path) => relative(src, path) !== TOKEN_OWNER)
      .flatMap((path) =>
        readFileSync(path, 'utf8')
          .split('\n')
          .flatMap((line, index) =>
            RAW_COLOUR.test(line)
              ? [`${relative(src, path)}:${index + 1}: ${line.trim()}`]
              : [],
          ),
      );
    expect(offenders).toEqual([]);
  });

  it('exports a non-empty appName', () => {
    expect(appName.trim().length).toBeGreaterThan(0);
  });
});
