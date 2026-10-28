import { z } from 'zod';
import { readChecked, writeChecked } from './yaml-check';

/**
 * The one schema for asset.yaml: one model version in the models repository
 * (plan section 5). Written once when the version is committed, never edited.
 */
const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'use lower-case words joined by "-"');
const Text = z.string().trim().min(1);
const Sha256 = z.string().regex(/^[0-9a-f]{64}$/, 'must be 64 hex characters');
const Count = z.int().nonnegative();

const AssetRecordSchema = z.strictObject({
  schema: z.literal(1),
  id: z.uuid(),
  slug: Slug,
  version: z.int().positive(),
  status: z.enum(['active', 'archived']),
  title: Text,
  description: Text,
  tags: z.array(Text).min(1),
  model: z.strictObject({
    file: z.literal('model.glb'),
    sha256: Sha256,
    bytes: z.int().positive(),
    triangles: Count,
    size_m: z.tuple([z.number(), z.number(), z.number()]),
  }),
  thumbnail: z.literal('thumbnail.webp'),
  source: z.strictObject({
    kind: z.enum(['library', 'generated', 'uploaded']),
    name: z.enum([
      'poly-haven',
      'poly-pizza',
      'meshy',
      'tripo',
      'rodin',
      'uploaded',
    ]),
    url: z.url().nullable(),
    ref: Text.nullable(),
    model: Text.nullable(),
    prompt: Text.nullable(),
  }),
  licence: z.strictObject({
    spdx: z.enum([
      'CC0-1.0',
      'CC-BY-4.0',
      'LicenseRef-owned-by-generator-plan',
    ]),
    attribution: Text.nullable(),
  }),
  cost: z.strictObject({
    usd: z.number().nonnegative(),
    credits: Count.nullable(),
  }),
  made: z.iso.datetime({ offset: true }),
  made_by: Text,
});

export type AssetRecord = z.infer<typeof AssetRecordSchema>;

export function readAssetYaml(text: string): AssetRecord {
  return readChecked('asset.yaml', AssetRecordSchema, text);
}

export function writeAssetYaml(record: AssetRecord): string {
  return writeChecked('asset.yaml', AssetRecordSchema, record);
}
