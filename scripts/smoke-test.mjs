#!/usr/bin/env node
/**
 * STDIO transport smoke test.
 *
 * Starts the built server over STDIO, sends an `initialize` and a
 * `tools/list` request, and asserts that:
 *   1. stdout contains ONLY valid JSON-RPC messages (MCP spec requirement —
 *      anything else corrupts the transport, see issue #18)
 *   2. the server responds to initialize
 *   3. tools/list returns a non-empty tool set
 *
 * No YouTube API key is required; the server validates keys lazily.
 */
import { spawn } from 'node:child_process';

const TIMEOUT_MS = 10_000;

const proc = spawn('node', ['dist/index.js'], {
  env: { ...process.env, YOUTUBE_API_KEY: 'smoke-test-key', MCP_TRANSPORT: 'stdio' },
  stdio: ['pipe', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';
proc.stdout.on('data', (d) => { stdout += d; });
proc.stderr.on('data', (d) => { stderr += d; });

function send(msg) {
  proc.stdin.write(JSON.stringify(msg) + '\n');
}

send({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'smoke-test', version: '1.0.0' },
  },
});

setTimeout(() => {
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
}, 1500);

setTimeout(() => {
  proc.kill();

  const failures = [];
  const lines = stdout.trim().split('\n').filter(Boolean);
  const messages = [];

  for (const line of lines) {
    try {
      messages.push(JSON.parse(line));
    } catch {
      failures.push(`Non-JSON output on stdout (corrupts STDIO transport): ${JSON.stringify(line.slice(0, 120))}`);
    }
  }

  const initResponse = messages.find((m) => m.id === 1);
  if (!initResponse?.result?.serverInfo) {
    failures.push('No valid initialize response received');
  }

  const toolsResponse = messages.find((m) => m.id === 2);
  const toolCount = toolsResponse?.result?.tools?.length ?? 0;
  if (toolCount === 0) {
    failures.push('tools/list returned no tools');
  }

  if (failures.length > 0) {
    console.error('SMOKE TEST FAILED:');
    for (const f of failures) console.error(`  - ${f}`);
    console.error('\n--- server stderr ---\n' + stderr);
    process.exit(1);
  }

  console.log(`SMOKE TEST PASSED: initialize ok (${initResponse.result.serverInfo.name} v${initResponse.result.serverInfo.version}), ${toolCount} tools listed, stdout clean.`);
  process.exit(0);
}, TIMEOUT_MS);
