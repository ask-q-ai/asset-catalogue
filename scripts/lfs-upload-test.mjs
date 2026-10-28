#!/usr/bin/env node
// The one-file Git LFS upload test (PRD R1, plan section 8.2 step 7).
//
//   node scripts/lfs-upload-test.mjs
//
// Proves the GitHub App's installation token can, without a clone: upload one
// file through the LFS batch API, commit its pointer with the Git Data API,
// and that a fresh clone with `git lfs pull` gets back the identical file.
// Runs only against ask-q-ai/3d-assets-lfs-test, never the real models
// repository. Never prints the key or the token.
import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { API, TIME_LIMIT_MS, call, installationToken } from './github-app.mjs';

const OWNER = 'ask-q-ai';
const REPO = '3d-assets-lfs-test';
const LFS = 'application/vnd.git-lfs+json';
const ATTRIBUTES =
  '*.glb filter=lfs diff=lfs merge=lfs -text\n' +
  '*.bin filter=lfs diff=lfs merge=lfs -text\n';

const basic = (token) =>
  `Basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`;

async function lfsUpload(token, file, oid) {
  const object = { oid, size: file.length };
  const batch = await call(
    `https://github.com/${OWNER}/${REPO}.git/info/lfs/objects/batch`,
    {
      method: 'POST',
      auth: basic(token),
      type: LFS,
      body: { operation: 'upload', transfers: ['basic'], objects: [object] },
    },
  );
  const { actions, error } = batch.objects[0];
  if (error) throw new Error(`LFS refused the file: ${error.message}`);
  if (!actions?.upload) return 'GitHub already had the file; nothing sent.';
  const put = await fetch(actions.upload.href, {
    method: 'PUT',
    headers: actions.upload.header ?? {},
    body: file,
    signal: AbortSignal.timeout(TIME_LIMIT_MS),
  });
  if (!put.ok) throw new Error(`LFS upload failed: ${put.status}`);
  if (actions.verify) {
    const auth = actions.verify.header?.Authorization ?? basic(token);
    const opts = { method: 'POST', auth, type: LFS, body: object };
    await call(actions.verify.href, opts);
  }
  return 'Uploaded and verified.';
}

/** The tip of main; an empty repository is started with .gitattributes. */
async function mainCommit(repo, auth) {
  try {
    return (await call(`${repo}/git/ref/heads/main`, { auth })).object.sha;
  } catch {
    const content = Buffer.from(ATTRIBUTES).toString('base64');
    const message = 'Start the LFS test repository';
    const body = { message, branch: 'main', content };
    await call(`${repo}/contents/.gitattributes`, {
      method: 'PUT',
      auth,
      body,
    });
    return (await call(`${repo}/git/ref/heads/main`, { auth })).object.sha;
  }
}

async function commitPointer(token, path, pointer) {
  const auth = `Bearer ${token}`;
  const repo = `${API}/repos/${OWNER}/${REPO}`;
  const post = (url, body) => call(url, { method: 'POST', auth, body });
  const parent = await call(
    `${repo}/git/commits/${await mainCommit(repo, auth)}`,
    { auth },
  );
  const blob = await post(`${repo}/git/blobs`, {
    content: pointer,
    encoding: 'utf-8',
  });
  const entry = { path, mode: '100644', type: 'blob', sha: blob.sha };
  const tree = await post(`${repo}/git/trees`, {
    base_tree: parent.tree.sha,
    tree: [entry],
  });
  const message = `LFS test: add ${path}`;
  const commit = await post(`${repo}/git/commits`, {
    message,
    tree: tree.sha,
    parents: [parent.sha],
  });
  const body = { sha: commit.sha, force: false };
  await call(`${repo}/git/refs/heads/main`, { method: 'PATCH', auth, body });
  return commit.sha;
}

function cloneAndCompare(token, path, oid) {
  const dir = mkdtempSync(join(tmpdir(), 'lfs-test-'));
  const config = [
    `http.extraHeader=Authorization: ${basic(token)}`,
    'filter.lfs.process=git-lfs filter-process',
    'filter.lfs.smudge=git-lfs smudge -- %f',
    'filter.lfs.clean=git-lfs clean -- %f',
    'filter.lfs.required=true',
  ].flatMap((setting) => ['-c', setting]);
  const env = {
    ...process.env,
    GIT_LFS_SKIP_SMUDGE: '1',
    GIT_TERMINAL_PROMPT: '0',
  };
  const git = (args, cwd) =>
    execFileSync('git', [...config, ...args], {
      cwd,
      env,
      stdio: 'pipe',
      timeout: TIME_LIMIT_MS,
    });
  try {
    git(
      ['clone', '--quiet', `https://github.com/${OWNER}/${REPO}.git`, 'clone'],
      dir,
    );
    git(['lfs', 'pull'], join(dir, 'clone'));
    const content = readFileSync(join(dir, 'clone', path));
    const got = createHash('sha256').update(content).digest('hex');
    if (got !== oid)
      console.log(`   Got back ${content.length} bytes instead.`);
    return got === oid;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const token = await installationToken(REPO);
const file = randomBytes(200_000);
const oid = createHash('sha256').update(file).digest('hex');
const path = `lfs-test/${new Date().toISOString().slice(0, 10)}-${oid.slice(0, 8)}.bin`;
console.log(
  `1. Made a ${file.length}-byte test file, sha256 ${oid.slice(0, 12)}…`,
);
console.log(`2. LFS: ${await lfsUpload(token, file, oid)}`);
const pointer = `version https://git-lfs.github.com/spec/v1\noid sha256:${oid}\nsize ${file.length}\n`;
const sha = await commitPointer(token, path, pointer);
console.log(`3. Committed the pointer as ${path} in commit ${sha}`);
const same = cloneAndCompare(token, path, oid);
console.log(
  `4. A fresh clone with git lfs pull gives back the identical file: ${same ? 'yes' : 'NO'}`,
);
process.exit(same ? 0 : 1);
