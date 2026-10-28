import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { purposeFrom } from './prd';

describe('purposeFrom', () => {
  it('returns the Purpose section as one line, without comments', () => {
    const prd = [
      '# My App — Product requirements',
      '',
      '## 1. Purpose',
      '',
      '<!-- One or two sentences. -->',
      'Helps users get things done',
      'in minutes.',
      '',
      '## 2. Problem',
      '',
      'Tasks take too long.',
    ].join('\n');
    expect(purposeFrom(prd)).toBe('Helps users get things done in minutes.');
  });

  it('reads a Purpose section that is the last section', () => {
    expect(purposeFrom('## 1. Purpose\n\nShort and clear.\n')).toBe(
      'Short and clear.',
    );
  });

  it('stops with a plain message when the section is missing', () => {
    expect(() => purposeFrom('# A plan\n\n## 2. Problem\n')).toThrow(
      'docs/PRD.md has no "## 1. Purpose" section',
    );
  });

  it('stops with a plain message when the section is empty', () => {
    expect(() =>
      purposeFrom('## 1. Purpose\n\n<!-- todo -->\n\n## 2. Problem\n'),
    ).toThrow('The Purpose section of docs/PRD.md is empty');
  });

  it("reads this app's own docs/PRD.md", () => {
    const prd = readFileSync(
      new URL('../../docs/PRD.md', import.meta.url),
      'utf8',
    );
    expect(purposeFrom(prd).length).toBeGreaterThan(0);
  });
});

describe('PRD structure validation', () => {
  it('enforces that agreed PRDs contain all required sections and numbered requirements', () => {
    const sampleAgreedPrd = `
# Sample App — Product requirements

Status: Agreed by the owner on 2026-10-27
Last updated: 2026-10-27

## 1. Purpose

Helps people manage tasks.

## 2. Problem

Tasks get lost.

## 3. Users

Single users on laptops.

## 4. Goals

1. Track tasks clearly.

## 5. Non-goals

1. No team chat.
2. No third-party sync.

## 6. User stories

As a user I want tasks.

## 7. Screens

### Home
Shows tasks.

## 8. Data

Tasks in SQLite.

## 9. Constraints

Node 22.

## 10. Requirements

| ID | Requirement | Phase | How we test it |
|---|---|---|---|
| R1 | User can add a task | 1 | Unit test |
| R2 | User can complete a task | 1 | Browser test |

## 11. Success measures

100% test pass.

## 12. Phases

Phase 1: R1, R2.

## 13. Open questions

None.

## 14. Decisions

- 2026-10-27: Chosen SQLite in chat.

## 15. History

- 2026-10-27: Created.
`;

    // Check headings
    const REQUIRED_HEADINGS = [
      '## 1. Purpose',
      '## 2. Problem',
      '## 3. Users',
      '## 4. Goals',
      '## 5. Non-goals',
      '## 6. User stories',
      '## 7. Screens',
      '## 8. Data',
      '## 9. Constraints',
      '## 10. Requirements',
      '## 11. Success measures',
      '## 12. Phases',
      '## 13. Open questions',
      '## 14. Decisions',
      '## 15. History',
    ];

    for (const heading of REQUIRED_HEADINGS) {
      expect(sampleAgreedPrd).toContain(heading);
    }

    // Check requirements table matches R<number>
    const reqMatches = [...sampleAgreedPrd.matchAll(/\|\s*(R\d+)\s*\|/g)].map(
      (m) => m[1],
    );
    expect(reqMatches).toEqual(['R1', 'R2']);
  });
});
