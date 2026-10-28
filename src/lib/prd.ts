import { z } from 'zod';

/**
 * Reads the Purpose section ("## 1. Purpose") of docs/PRD.md, so the home
 * page always shows what the plan says the app is for.
 */
const PURPOSE_HEADING = /^##\s+1\.\s+Purpose\s*$/m;
const PrdSchema = z.string().min(1, 'PRD text cannot be empty');

export function purposeFrom(prd: string): string {
  const content = PrdSchema.parse(prd);
  const heading = PURPOSE_HEADING.exec(content);
  if (!heading)
    throw new Error(
      'docs/PRD.md has no "## 1. Purpose" section. Run the write-prd skill to write the plan.',
    );
  const rest = prd.slice(heading.index + heading[0].length);
  const next = rest.search(/^##\s/m);
  const section = next === -1 ? rest : rest.slice(0, next);
  const purpose = section
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!purpose)
    throw new Error(
      'The Purpose section of docs/PRD.md is empty. Write one or two sentences saying what the app is for.',
    );
  return purpose;
}
