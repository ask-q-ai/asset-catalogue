/**
 * Made-up settings for the browser tests only. None of them reaches a real
 * system: nothing in the app connects anywhere yet, and later tests replace
 * GitHub, Poly Haven and the database with fakes or the fixtures database.
 */
export const TEST_SETTINGS = {
  DATABASE_URL: 'postgres://localhost:5432/asset_catalogue_test',
  ASSETS_REPO: 'test-owner/test-assets',
  ASSET_CATALOGUE_GITHUB_APP_ID: '1',
  ASSET_CATALOGUE_GITHUB_APP_INSTALLATION_ID: '1',
  ASSET_CATALOGUE_GITHUB_APP_CLIENT_ID: 'test-client-id',
  ASSET_CATALOGUE_GITHUB_APP_CLIENT_SECRET: 'test-client-secret',
  ASSET_CATALOGUE_GITHUB_APP_KEY_FILE: 'tests/no-such-key.pem',
  ALLOWED_GITHUB_USERS: 'test-user',
  SESSION_SECRET: 'test-session-secret-that-is-long-enough',
  MATCH_THRESHOLD: '0.9',
  NEAR_THRESHOLD: '0.8',
  MAX_GLB_MB: '50',
  REQUEST_DEADLINE_MIN: '15',
  MONTHLY_CAP_USD: '0',
  GENERATORS_ON: '',
};
