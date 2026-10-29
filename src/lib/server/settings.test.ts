import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TEST_SETTINGS } from '../../../tests/test-settings';
import { readSettings, SETTING_NAMES, SettingsError } from './settings';

const without = (name: string) =>
  Object.fromEntries(
    Object.entries(TEST_SETTINGS).filter(([key]) => key !== name),
  );

describe('readSettings', () => {
  it('reads every setting and turns numbers and lists into values', () => {
    const settings = readSettings({
      ...TEST_SETTINGS,
      ALLOWED_GITHUB_USERS: ' Test-User , other ',
    });
    expect(settings.MATCH_THRESHOLD).toBe(0.9);
    expect(settings.ASSET_CATALOGUE_GITHUB_APP_ID).toBe(1);
    expect(settings.ALLOWED_GITHUB_USERS).toEqual(['test-user', 'other']);
    expect(settings.GENERATORS_ON).toBe('');
  });

  it.each(SETTING_NAMES)('stops and names %s when it is missing', (name) => {
    expect(() => readSettings(without(name))).toThrow(
      `The setting ${name} is missing.`,
    );
  });

  it('says where to set a missing setting', () => {
    expect(() => readSettings({})).toThrow('~/.config/dave-hq/local.env');
  });

  it('names every problem at once', () => {
    expect(() => readSettings(without('MAX_GLB_MB'))).toThrow(SettingsError);
    const message = (() => {
      try {
        readSettings({ DATABASE_URL: 'mysql://x' });
      } catch (error) {
        return String(error);
      }
      return '';
    })();
    expect(message).toContain(
      'The setting DATABASE_URL must start with postgres://.',
    );
    expect(message).toContain('The setting SESSION_SECRET is missing.');
  });

  it.each([
    ['MATCH_THRESHOLD', '1.5', 'MATCH_THRESHOLD'],
    ['MAX_GLB_MB', 'fifty', 'MAX_GLB_MB must be a number'],
    ['REQUEST_DEADLINE_MIN', '2.5', 'REQUEST_DEADLINE_MIN'],
    ['ASSETS_REPO', 'just-a-name', 'ASSETS_REPO must look like owner/name'],
    [
      'SESSION_SECRET',
      'short',
      'SESSION_SECRET must be at least 32 characters',
    ],
    [
      'ALLOWED_GITHUB_USERS',
      ' , ',
      'ALLOWED_GITHUB_USERS must name at least one GitHub account',
    ],
    ['GENERATORS_ON', 'meshy', 'paid generation is off'],
    [
      'NEAR_THRESHOLD',
      '0.95',
      'NEAR_THRESHOLD must be lower than MATCH_THRESHOLD',
    ],
  ])('refuses a wrong %s', (name, value, message) => {
    expect(() => readSettings({ ...TEST_SETTINGS, [name]: value })).toThrow(
      message,
    );
  });

  it('has every setting listed in .env.example, with no values', () => {
    const example = readFileSync(
      new URL('../../../.env.example', import.meta.url),
      'utf8',
    );
    const listed = example.split('\n').filter((line) => /^[A-Z_]+=/.test(line));
    expect(listed.map((line) => line.split('=')[0]).sort()).toEqual(
      [...SETTING_NAMES].sort(),
    );
    expect(listed.every((line) => line.endsWith('='))).toBe(true);
  });
});
