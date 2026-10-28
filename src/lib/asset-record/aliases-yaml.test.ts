import { describe, expect, it } from 'vitest';
import { appendAlias, readAliasesYaml, type Alias } from './aliases-yaml';

const first: Alias = {
  query: 'a test cask',
  accepted_at: '2026-11-02T10:14:00+07:00',
  accepted_by: 'test-user',
};
const second: Alias = { ...first, query: 'a test drum' };

describe('aliases.yaml', () => {
  it('starts a new file with the first accepted search', () => {
    expect(readAliasesYaml(appendAlias(null, first))).toEqual({
      schema: 1,
      aliases: [first],
    });
  });

  it('adds later searches at the end and keeps the earlier ones', () => {
    const text = appendAlias(appendAlias(null, first), second);
    expect(readAliasesYaml(text).aliases).toEqual([first, second]);
  });

  it('does not add the same search twice, whatever its case', () => {
    const text = appendAlias(null, first);
    const again = appendAlias(text, { ...first, query: ' A Test Cask ' });
    expect(readAliasesYaml(again).aliases).toHaveLength(1);
  });

  it('refuses an entry with no search text and names the field', () => {
    expect(() => appendAlias(null, { ...first, query: ' ' })).toThrow(
      'aliases.yaml: "aliases.0.query" is wrong',
    );
  });

  it('refuses a broken file instead of overwriting it', () => {
    expect(() => appendAlias('schema: 2\naliases: []\n', first)).toThrow(
      '"schema" is wrong',
    );
  });
});
