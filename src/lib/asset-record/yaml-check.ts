import { parse, stringify } from 'yaml';
import type { z } from 'zod';

/** A record file that does not match its schema. The message names the field. */
export class RecordError extends Error {
  override name = 'RecordError';
}

/**
 * Reads YAML text and checks it against a schema. Stops with a message that
 * names the file and the first wrong field, so a bad file never gets in.
 */
export function readChecked<T extends z.ZodType>(
  file: string,
  schema: T,
  text: string,
): z.infer<T> {
  let data: unknown;
  try {
    data = parse(text);
  } catch (error) {
    throw new RecordError(`${file} is not valid YAML: ${String(error)}`);
  }
  return checked(file, schema, data);
}

/** Checks a record against its schema, then writes it as YAML. */
export function writeChecked(
  file: string,
  schema: z.ZodType,
  record: unknown,
): string {
  return stringify(checked(file, schema, record), { lineWidth: 0 });
}

function checked<T extends z.ZodType>(
  file: string,
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const [problem] = result.error.issues.slice(0, 1).map((issue) => {
    const field = issue.path.join('.') || '(the whole file)';
    return `"${field}" is wrong — ${issue.message}`;
  });
  throw new RecordError(`${file}: ${String(problem)}.`);
}
