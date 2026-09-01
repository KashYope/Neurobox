import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { Express } from 'express';

const startServer = (app: Express) =>
  new Promise<{ server: http.Server; url: string }>(resolve => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });

test('requires CORS_ORIGINS in production', async () => {
  const envVars: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: 'production' };
  delete envVars.CORS_ORIGINS;

  const { loadEnv } = await import('../server/src/env');

  assert.throws(() => loadEnv(envVars), /CORS_ORIGINS must be set/);
});

test('rejects invalid schemes in CORS_ORIGINS', async () => {
  const envVars: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production',
    CORS_ORIGINS: 'ftp://example.com'
  };

  const { loadEnv } = await import('../server/src/env');

  assert.throws(() => loadEnv(envVars), /only http and https are allowed/);
});

test('allows configured origins and rejects others', async () => {
  const envVars: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production',
    CORS_ORIGINS: 'https://allowed.example.com, https://second.example.com'
  };

  process.env.NODE_ENV = 'test';

  const { loadEnv } = await import('../server/src/env');
  const { createApp } = await import('../server/src/index');

  const app = createApp(loadEnv(envVars));
  const { server, url } = await startServer(app);

  try {
    const allowedResponse = await fetch(`${url}/healthz`, {
      headers: { Origin: 'https://allowed.example.com' }
    });

    assert.equal(allowedResponse.status, 200);
    assert.equal(allowedResponse.headers.get('access-control-allow-origin'), 'https://allowed.example.com');

    const deniedResponse = await fetch(`${url}/healthz`, {
      headers: { Origin: 'https://evil.example.com' }
    });

    assert.equal(deniedResponse.status, 403);
    const body = await deniedResponse.json();
    assert.equal(body.message, 'Origin not allowed');
  } finally {
    server.close();
  }
});
