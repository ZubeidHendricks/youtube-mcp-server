#!/usr/bin/env node
/**
 * Remote authorization test (MCP_REMOTE_AUTHORIZATION=true).
 *
 * Asserts, against the built server, that:
 *   1. two requests handled at the same time each use their own token, and
 *      neither ever falls back to the server's API key
 *   2. a call with no token fails instead of using the server's API key
 *   3. over HTTP, a request without `Authorization: Bearer` is refused (401)
 *   4. over HTTP, a request with one is served, and its token reaches the tool
 *      that runs — the tool call must not fail for want of a token
 *   5. with MCP_LOG_LEVEL=warn no request body or tool argument is logged
 *
 * A server-side key is set on purpose throughout: the point is that it is
 * never used. The tokens are made up, so the one call that reaches Google is
 * refused there; no YouTube credential is needed to run this.
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 18761;
const SERVER_KEY = 'server-side-key-that-must-never-be-used';
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

process.env.MCP_REMOTE_AUTHORIZATION = 'true';
process.env.YOUTUBE_API_KEY = SERVER_KEY;

// ---- 1 + 2: the client each request gets -----------------------------------
const { runWithAccessToken } = await import('../dist/services/request-auth.js');
const { withYouTubeClient } = await import('../dist/services/youtube-client.js');

const credentialOf = (youtube) => youtube.context._options.auth;
const use = (token, delayMs) =>
  runWithAccessToken(token, async () => {
    await sleep(delayMs); // let the other request run in between
    return withYouTubeClient(async (youtube) => credentialOf(youtube));
  });

const [a, b] = await Promise.all([use('token-of-a', 30), use('token-of-b', 5)]);
check(a?.credentials?.access_token === 'token-of-a', 'request A did not get its own token');
check(b?.credentials?.access_token === 'token-of-b', 'request B did not get its own token');
check(a !== SERVER_KEY && b !== SERVER_KEY, 'a request was given the server API key');

let refused = false;
try {
  await withYouTubeClient(async (youtube) => credentialOf(youtube));
} catch {
  refused = true;
}
check(refused, 'a call with no token was served (it must not fall back to the server API key)');

// ---- 3, 4, 5: over HTTP ------------------------------------------------------
const proc = spawn('node', ['dist/index.js'], {
  env: {
    ...process.env,
    MCP_TRANSPORT: 'http',
    MCP_HOST: '127.0.0.1',
    MCP_PORT: String(PORT),
    MCP_LOG_LEVEL: 'warn',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let stderr = '';
proc.stderr.on('data', (d) => { stderr += d; });

const url = `http://127.0.0.1:${PORT}/mcp`;
const post = (body, token) =>
  fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });

try {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/ready`)).ok) break;
    } catch { /* not listening yet */ }
    await sleep(100);
  }

  const toolsList = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

  const anonymous = await post(toolsList);
  check(anonymous.status === 401, `no token: expected 401, got ${anonymous.status}`);
  check(/^Bearer/i.test(anonymous.headers.get('www-authenticate') || ''), 'no token: no WWW-Authenticate: Bearer');

  const wrongScheme = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Basic abc' },
    body: JSON.stringify(toolsList),
  });
  check(wrongScheme.status === 401, `non-bearer scheme: expected 401, got ${wrongScheme.status}`);

  const listed = await post(toolsList, 'made-up-token');
  const tools = (await listed.json())?.result?.tools;
  check(listed.status === 200 && Array.isArray(tools) && tools.length > 0, 'with a token: tools/list was not served');

  const MARKER = 'argument-that-must-not-be-logged';
  const called = await post(
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'videos_getVideo', arguments: { videoId: MARKER } } },
    'made-up-token'
  );
  const text = (await called.json())?.result?.content?.[0]?.text || '';
  check(text.length > 0, 'with a token: tools/call returned nothing');
  check(!/carried no access token/i.test(text), 'the request token did not reach the tool that ran');
  check(!/API key/i.test(text), `the tool call used an API key instead of the request token: ${text}`);

  await sleep(200);
  check(!stderr.includes(MARKER), 'MCP_LOG_LEVEL=warn still logged a request body or tool argument');
  check(!stderr.includes('made-up-token'), 'an access token was written to the log');
} finally {
  proc.kill();
}

if (failures.length) {
  console.error('REMOTE AUTH TEST FAILED:\n- ' + failures.join('\n- '));
  if (stderr) console.error('--- server stderr ---\n' + stderr);
  process.exit(1);
}
console.log('REMOTE AUTH TEST PASSED: per-request tokens isolated, no fallback to the server key, 401 without a token, quiet log.');
