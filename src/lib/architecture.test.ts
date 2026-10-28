import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../..', import.meta.url));
const src = join(root, 'src');
const tests = join(root, 'tests');
const IGNORED_DIRS = new Set(['node_modules', '.svelte-kit', 'build']);

function walk(dir: string, filter: (path: string) => boolean): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return IGNORED_DIRS.has(entry.name) ? [] : walk(full, filter);
    }
    return filter(full) ? [full] : [];
  });
}

function walkDirs(dir: string): string[] {
  const subdirs = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !IGNORED_DIRS.has(entry.name))
    .flatMap((entry) => walkDirs(join(dir, entry.name)));
  return [dir, ...subdirs];
}

const isSource = (path: string) => /\.(svelte|ts|js|mjs)$/.test(path);
const isSelf = (path: string) => path.endsWith('architecture.test.ts');

const ESCAPE_HATCH =
  /@ts-ignore|@ts-expect-error|eslint-disable|<!--\s*svelte-ignore\b|(?<![a-zA-Z0-9_])as\s+any\b|:\s*any\b/;
const FORBIDDEN_NAMES = new Set([
  'utils',
  'helpers',
  'common',
  'misc',
  'shared',
  'index',
]);
const LAZY_SPLIT_NAME =
  /(?:[-_](?:part|v|ext|extra|more|new|old|temp|tmp|misc|util|utils|helper|helpers)\d*|\d+)$/i;

function resolveImportTarget(
  file: string,
  specifier: string,
  sourceSet: Set<string>,
): string | undefined {
  let base = '';
  if (specifier.startsWith('$lib/')) {
    base = join(src, 'lib', specifier.slice('$lib/'.length));
  } else if (specifier.startsWith('.')) {
    base = resolve(dirname(file), specifier);
  }
  if (!base) return undefined;
  const exts = ['', '.ts', '.svelte.ts', '.js', '.svelte'];
  return exts
    .map((ext) => base + ext)
    .find((candidate) => sourceSet.has(candidate));
}

function findCycles(
  graph: Map<string, string[]>,
  formatNode: (n: string) => string,
): string[] {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: string[] = [];

  function visitNeighbor(neighbor: string, path: string[]) {
    if (!visited.has(neighbor)) {
      dfs(neighbor, [...path, neighbor]);
    } else if (inStack.has(neighbor)) {
      cycles.push([...path, neighbor].map(formatNode).join(' -> '));
    }
  }

  function dfs(node: string, path: string[]) {
    visited.add(node);
    inStack.add(node);
    for (const neighbor of graph.get(node) ?? []) {
      visitNeighbor(neighbor, path);
    }
    inStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) dfs(node, [node]);
  }
  return cycles;
}

describe('architecture and code quality gates', () => {
  it('forbids escape hatches: @ts-ignore, @ts-expect-error, eslint-disable, svelte-ignore, and any', () => {
    const allFiles = [...walk(src, isSource), ...walk(tests, isSource)].filter(
      (path) => !isSelf(path),
    );

    const violations = allFiles.flatMap((path) =>
      readFileSync(path, 'utf8')
        .split('\n')
        .flatMap((line, index) =>
          ESCAPE_HATCH.test(line)
            ? [`${relative(root, path)}:${index + 1}: ${line.trim()}`]
            : [],
        ),
    );

    expect(
      violations,
      'Escape hatches (@ts-ignore, eslint-disable, svelte-ignore, any) are forbidden. Fix the types properly.',
    ).toEqual([]);
  });

  it('forbids dumping-ground and lazy-split filenames', () => {
    const sourceFiles = walk(src, isSource);

    const violations = sourceFiles
      .filter((path) => {
        const base = relative(src, path).split(/[/\\]/).pop() ?? '';
        const stem = base
          .replace(/\.test\.(ts|js)$/, '')
          .replace(/\.(svelte\.)?(ts|js|svelte)$/, '');
        return (
          FORBIDDEN_NAMES.has(stem.toLowerCase()) || LAZY_SPLIT_NAME.test(stem)
        );
      })
      .map((path) => relative(root, path));

    expect(
      violations,
      'Generic dumping-ground files (utils, helpers, common, shared, index) and lazy split names (e.g. orders2, orders-part2, orders-helpers, orders-extra) are forbidden. Name each file after the specific domain concept it owns.',
    ).toEqual([]);
  });

  it('forbids more than 8 non-test source files in any single src/lib/ directory', () => {
    const MAX_FILES_PER_DIR = 8;
    const libDir = join(src, 'lib');
    const dirs = walkDirs(libDir);

    const overcrowded = dirs.flatMap((dir) => {
      const files = readdirSync(dir, { withFileTypes: true }).filter(
        (entry) =>
          entry.isFile() &&
          isSource(entry.name) &&
          !entry.name.endsWith('.test.ts'),
      );
      return files.length > MAX_FILES_PER_DIR
        ? [
            `${relative(root, dir)}: ${files.length} files (max ${MAX_FILES_PER_DIR}). Group related modules into domain subfolders (src/lib/<domain>/).`,
          ]
        : [];
    });

    expect(
      overcrowded,
      'No single directory in src/lib/ may contain more than 8 non-test source files. Group related modules into domain subfolders (src/lib/<domain>/).',
    ).toEqual([]);
  });

  it('forbids files exceeding 300 lines to enforce single responsibility', () => {
    const MAX_LINES = 300;
    const sourceFiles = walk(src, isSource);

    const oversized = sourceFiles.flatMap((path) => {
      const lineCount = readFileSync(path, 'utf8').split('\n').length;
      return lineCount > MAX_LINES
        ? [
            `${relative(root, path)}: ${lineCount} lines (max allowed: ${MAX_LINES})`,
          ]
        : [];
    });

    expect(
      oversized,
      'Files must not exceed 300 lines. Split large files by responsibility into focused modules.',
    ).toEqual([]);
  });

  it('forbids cross-route imports in src/routes/', () => {
    const routesDir = join(src, 'routes');
    const routeFiles = walk(routesDir, isSource);

    const violations = routeFiles.flatMap((file) => {
      const content = readFileSync(file, 'utf8');
      const fileDir = dirname(file);
      const thisRel = relative(routesDir, fileDir).split(/[/\\]/)[0] ?? '';
      const matches = [
        ...content.matchAll(
          /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"](\.[^'"]+)['"]/g,
        ),
      ];

      return matches.flatMap((match) => {
        const specifier = match[1] ?? '';
        const relToFile = relative(routesDir, resolve(fileDir, specifier));
        const targetRel = relToFile.split(/[/\\]/)[0] ?? '';
        const crossesRoute =
          Boolean(thisRel && targetRel) &&
          thisRel !== targetRel &&
          !relToFile.startsWith('..');
        return crossesRoute
          ? [
              `${relative(root, file)} imports from sibling route "${specifier}". Move shared code to src/lib/.`,
            ]
          : [];
      });
    });

    expect(violations).toEqual([]);
  });

  it('detects and forbids circular dependencies in src/', () => {
    const sourceFiles = walk(src, isSource);
    const sourceSet = new Set(sourceFiles);
    const graph = new Map<string, string[]>();

    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf8');
      const matches = [
        ...content.matchAll(
          /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g,
        ),
      ];
      const imports = matches
        .map((m) => resolveImportTarget(file, m[1] ?? '', sourceSet))
        .filter((target): target is string => Boolean(target));
      graph.set(file, imports);
    }

    const cycles = findCycles(graph, (f) => relative(root, f));
    expect(
      cycles,
      'Circular dependencies detected. Decouple modules or extract shared contracts.',
    ).toEqual([]);
  });
});

describe('architecture detector self-tests', () => {
  it('detects simulated circular imports', () => {
    const dummyGraph = new Map<string, string[]>([
      ['a.ts', ['b.ts']],
      ['b.ts', ['c.ts']],
      ['c.ts', ['a.ts']],
    ]);
    expect(findCycles(dummyGraph, (n) => n)).toEqual([
      'a.ts -> b.ts -> c.ts -> a.ts',
    ]);
  });

  it('detects simulated escape hatches and lazy split names', () => {
    expect(ESCAPE_HATCH.test('// @ts' + '-ignore')).toBe(true);
    expect(ESCAPE_HATCH.test('/* eslint' + '-disable */')).toBe(true);
    expect(ESCAPE_HATCH.test('const x: ' + 'any = 1;')).toBe(true);
    expect(ESCAPE_HATCH.test('return val as ' + 'any;')).toBe(true);
    expect(ESCAPE_HATCH.test('const x: string = "clean";')).toBe(false);
    expect(LAZY_SPLIT_NAME.test('orders2')).toBe(true);
    expect(LAZY_SPLIT_NAME.test('orders-part2')).toBe(true);
    expect(LAZY_SPLIT_NAME.test('orders-helpers')).toBe(true);
    expect(LAZY_SPLIT_NAME.test('orders-extra')).toBe(true);
    expect(LAZY_SPLIT_NAME.test('order-pricing')).toBe(false);
  });
});
