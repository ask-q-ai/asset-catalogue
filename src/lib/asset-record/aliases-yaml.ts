import { z } from 'zod';
import { readChecked, writeChecked } from './yaml-check';

/**
 * The one schema for aliases.yaml: the searches a person or agent accepted
 * for one model (plan section 4). Entries are only ever appended.
 */
const AliasSchema = z.strictObject({
  query: z.string().trim().min(1),
  accepted_at: z.iso.datetime({ offset: true }),
  accepted_by: z.string().trim().min(1),
});

const AliasesSchema = z.strictObject({
  schema: z.literal(1),
  aliases: z.array(AliasSchema),
});

export type Alias = z.infer<typeof AliasSchema>;
type Aliases = z.infer<typeof AliasesSchema>;

export function readAliasesYaml(text: string): Aliases {
  return readChecked('aliases.yaml', AliasesSchema, text);
}

/**
 * The new aliases.yaml text with one accepted search added at the end.
 * Pass null for a model that has no aliases.yaml yet. A search already
 * accepted (same words, any case) is not added twice.
 */
export function appendAlias(current: string | null, alias: Alias): string {
  const existing =
    current === null
      ? { schema: 1 as const, aliases: [] }
      : readAliasesYaml(current);
  const same = (a: Alias) =>
    a.query.toLowerCase() === alias.query.trim().toLowerCase();
  if (existing.aliases.some(same))
    return writeChecked('aliases.yaml', AliasesSchema, existing);
  const next = { ...existing, aliases: [...existing.aliases, alias] };
  return writeChecked('aliases.yaml', AliasesSchema, next);
}
