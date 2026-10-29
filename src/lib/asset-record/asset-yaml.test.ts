import { describe, expect, it } from 'vitest';
import { readAssetYaml, writeAssetYaml, type AssetRecord } from './asset-yaml';
import { RecordError } from './yaml-check';

/** A made-up record for tests only; it is not a real model. */
const fixture: AssetRecord = {
  schema: 1,
  id: '6f0c9a52-6a8e-4c1b-9d4e-1f7f2a0e3b11',
  slug: 'test-barrel',
  version: 1,
  status: 'active',
  title: 'Test barrel',
  description: 'A made-up barrel used only in tests.',
  tags: ['barrel', 'test'],
  model: {
    file: 'model.glb',
    sha256: 'a'.repeat(64),
    bytes: 1843200,
    triangles: 4210,
    size_m: [0.6, 0.9, 0.6],
  },
  thumbnail: 'thumbnail.webp',
  source: {
    kind: 'library',
    name: 'poly-haven',
    url: 'https://polyhaven.com/a/test_barrel',
    ref: 'test_barrel',
    model: null,
    prompt: null,
  },
  licence: { spdx: 'CC0-1.0', attribution: 'Test author, via Poly Haven' },
  cost: { usd: 0, credits: null },
  made: '2026-11-02T10:14:00+07:00',
  made_by: 'request 3b1e (agent "test")',
};

describe('asset.yaml', () => {
  it('gives back the same record after writing and reading it', () => {
    expect(readAssetYaml(writeAssetYaml(fixture))).toEqual(fixture);
  });

  it('keeps the time as written, with its offset', () => {
    expect(writeAssetYaml(fixture)).toContain(
      'made: 2026-11-02T10:14:00+07:00',
    );
  });

  it.each([
    ['slug', { slug: 'Test Barrel' }, '"slug" is wrong'],
    ['version', { version: 0 }, '"version" is wrong'],
    ['status', { status: 'deleted' }, '"status" is wrong'],
    ['tags', { tags: [] }, '"tags" is wrong'],
    [
      'sha256',
      { model: { ...fixture.model, sha256: 'xyz' } },
      '"model.sha256" is wrong — must be 64 hex characters',
    ],
    ['size', { model: { ...fixture.model, size_m: [1, 2] } }, '"model.size_m'],
    [
      'licence',
      { licence: { spdx: 'CC-BY-NC-4.0', attribution: null } },
      '"licence.spdx" is wrong',
    ],
    ['time', { made: '2 November' }, '"made" is wrong'],
    ['extra field', { colour: 'red' }, '(the whole file)'],
  ])('refuses a wrong %s and names the field', (_name, change, message) => {
    expect(() =>
      writeAssetYaml({ ...fixture, ...change } as AssetRecord),
    ).toThrow(message);
  });

  it('refuses a file that is not YAML at all', () => {
    expect(() => readAssetYaml('title: [unclosed')).toThrow(RecordError);
    expect(() => readAssetYaml('title: [unclosed')).toThrow(
      'asset.yaml is not valid YAML',
    );
  });

  it('refuses an empty file', () => {
    expect(() => readAssetYaml('')).toThrow(
      'asset.yaml: "(the whole file)" is wrong',
    );
  });
});
