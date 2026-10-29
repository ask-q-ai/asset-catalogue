// Signs in as the asset-catalogue GitHub App for scripts run on the Mac.
// Reads the app's details from ~/.config/dave-hq/local.env and never prints
// the key or a token.
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const API = 'https://api.github.com';
export const TIME_LIMIT_MS = 60_000;
const PREFIX = 'ASSET_CATALOGUE_GITHUB_APP_';

function settings() {
  const file = join(homedir(), '.config/dave-hq/local.env');
  const env = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^(ASSET_CATALOGUE_[A-Z_]+)=(.*)$/.exec(line.trim());
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  for (const name of ['ID', 'KEY_FILE', 'INSTALLATION_ID'])
    if (!env[PREFIX + name])
      throw new Error(`${PREFIX}${name} is missing from ${file}.`);
  return env;
}

function appJwt(env) {
  const part = (value) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const claims = { iat: now - 60, exp: now + 540, iss: env[PREFIX + 'ID'] };
  const body = `${part({ alg: 'RS256', typ: 'JWT' })}.${part(claims)}`;
  const keyFile = env[PREFIX + 'KEY_FILE'].replace(/^~/, homedir());
  const signature = createSign('RSA-SHA256')
    .update(body)
    .sign(readFileSync(keyFile), 'base64url');
  return `${body}.${signature}`;
}

/** One JSON call with a time limit; stops with the reply's status if it fails. */
export async function call(url, options) {
  const {
    method = 'GET',
    auth,
    body,
    type = 'application/vnd.github+json',
  } = options;
  const headers = { Authorization: auth, Accept: type };
  if (type.includes('github+json'))
    headers['X-GitHub-Api-Version'] = '2022-11-28';
  if (body !== undefined) headers['Content-Type'] = type;
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIME_LIMIT_MS),
  });
  const text = await response.text();
  if (!response.ok)
    throw new Error(`${method} ${url} failed: ${response.status} ${text}`);
  return text ? JSON.parse(text) : {};
}

/** A short-lived token that can write Contents in one repository only. */
export async function installationToken(repo) {
  const env = settings();
  const id = env[PREFIX + 'INSTALLATION_ID'];
  const reply = await call(`${API}/app/installations/${id}/access_tokens`, {
    method: 'POST',
    auth: `Bearer ${appJwt(env)}`,
    body: { repositories: [repo], permissions: { contents: 'write' } },
  });
  return reply.token;
}
