import { z } from 'zod';

/**
 * Every setting the service needs (PRD section 9, plan section 10). None has
 * a built-in value (golden rule 20): a missing or wrong one stops start-up
 * with a message naming it and where to set it.
 */
const WHERE =
  'Set it in ~/.config/dave-hq/local.env (secrets) or .env (everything else) on the Mac, or in the service variables in the cloud.';

const Text = z.string().trim().min(1);
const NumberText = (check: (n: z.ZodNumber) => z.ZodNumber) =>
  z
    .string()
    .trim()
    .regex(/^-?\d+(\.\d+)?$/, 'must be a number')
    .transform((value) => Number(value))
    .pipe(check(z.number()));
const Fraction = NumberText((n) => n.min(0).max(1));
const Whole = NumberText((n) => n.int().positive());

const SettingsSchema = z
  .object({
    DATABASE_URL: Text.regex(
      /^postgres(ql)?:\/\//,
      'must start with postgres://',
    ),
    ASSETS_REPO: Text.regex(/^[\w.-]+\/[\w.-]+$/, 'must look like owner/name'),
    ASSET_CATALOGUE_GITHUB_APP_ID: Whole,
    ASSET_CATALOGUE_GITHUB_APP_INSTALLATION_ID: Whole,
    ASSET_CATALOGUE_GITHUB_APP_CLIENT_ID: Text,
    ASSET_CATALOGUE_GITHUB_APP_CLIENT_SECRET: Text,
    ASSET_CATALOGUE_GITHUB_APP_KEY_FILE: Text,
    ALLOWED_GITHUB_USERS: Text.transform((value) =>
      value
        .split(',')
        .map((user) => user.trim().toLowerCase())
        .filter(Boolean),
    ).pipe(z.array(z.string()).min(1, 'must name at least one GitHub account')),
    SESSION_SECRET: Text.min(32, 'must be at least 32 characters'),
    MATCH_THRESHOLD: Fraction,
    NEAR_THRESHOLD: Fraction,
    MAX_GLB_MB: NumberText((n) => n.positive()),
    REQUEST_DEADLINE_MIN: Whole,
    MONTHLY_CAP_USD: NumberText((n) => n.min(0)),
    GENERATORS_ON: z
      .string()
      .trim()
      .refine(
        (value) => value === '',
        'must be empty: paid generation is off until Giggles chooses a generator',
      ),
  })
  .refine((s) => s.NEAR_THRESHOLD < s.MATCH_THRESHOLD, {
    path: ['NEAR_THRESHOLD'],
    message: 'must be lower than MATCH_THRESHOLD',
  });

type Settings = z.infer<typeof SettingsSchema>;

/** The names of every setting, for .env.example and error messages. */
export const SETTING_NAMES = Object.keys(SettingsSchema.shape);

export class SettingsError extends Error {
  override name = 'SettingsError';
}

/** Reads and checks every setting; stops with every problem named at once. */
export function readSettings(
  env: Record<string, string | undefined>,
): Settings {
  const result = SettingsSchema.safeParse(env);
  if (result.success) return result.data;
  const problems = result.error.issues.map((issue) => {
    const name = issue.path.join('.');
    return env[name] === undefined
      ? `The setting ${name} is missing.`
      : `The setting ${name} ${issue.message}.`;
  });
  throw new SettingsError(
    `The asset catalogue can't start.\n${problems.join('\n')}\n${WHERE}`,
  );
}
