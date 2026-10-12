import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request authorization for the HTTP transport.
 *
 * With MCP_REMOTE_AUTHORIZATION=true the server holds no YouTube credential of
 * its own: every HTTP request must carry `Authorization: Bearer <token>`, where
 * the token is a Google OAuth 2.0 access token granted a YouTube scope (for the
 * tools here, `https://www.googleapis.com/auth/youtube.readonly` is enough).
 * The token is used for the YouTube API calls made while handling that request
 * and for nothing else, so one process can serve many accounts.
 */
const requestAuth = new AsyncLocalStorage<{ accessToken: string }>();

export function remoteAuthorizationEnabled(): boolean {
  return (process.env.MCP_REMOTE_AUTHORIZATION || '').toLowerCase() === 'true';
}

/** The bearer token from an `Authorization` header, or undefined. */
export function bearerTokenFrom(header: string | string[] | undefined): string | undefined {
  const value = Array.isArray(header) ? header[0] : header;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(value || '');
  return match ? match[1] : undefined;
}

export function runWithAccessToken<T>(accessToken: string, callback: () => T): T {
  return requestAuth.run({ accessToken }, callback);
}

export function currentAccessToken(): string | undefined {
  return requestAuth.getStore()?.accessToken;
}
