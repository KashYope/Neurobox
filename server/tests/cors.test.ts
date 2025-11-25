import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import cors from 'cors';
import express from 'express';

process.env.NODE_ENV = 'test';
process.env.CORS_ORIGINS = 'https://allowed.example';

const { env } = await import('../src/env.ts');

const buildApp = () => {
  const app = express();
  const corsOrigins = env.allowedOrigins.length ? env.allowedOrigins : true;

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true
    })
  );

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
};

const startServer = () => buildApp().listen(0);

test('allows configured origins', async t => {
  const server = startServer();
  t.after(() => server.close());

  const address = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${address.port}/healthz`, {
    headers: {
      Origin: 'https://allowed.example'
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://allowed.example');
});

test('rejects disallowed origins', async t => {
  const server = startServer();
  t.after(() => server.close());

  const address = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${address.port}/healthz`, {
    headers: {
      Origin: 'https://blocked.example'
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});
