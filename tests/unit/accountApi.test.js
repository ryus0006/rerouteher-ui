import { afterEach, expect, test, vi } from 'vitest';
import { savePlan, signOut } from '../../src/api/account.js';

afterEach(() => vi.restoreAllMocks());

test('savePlan posts only the plan, with credentials', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ status: 'saved' }) });
  vi.stubGlobal('fetch', fetchMock);

  await savePlan({ plan: { a: 1 } });

  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/api/account/plan');
  expect(options.credentials).toBe('include');
  expect(JSON.parse(options.body)).toEqual({ plan: { a: 1 } });
});

test('signOut calls the sign-out endpoint with credentials', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ status: 'signed_out' }) });
  vi.stubGlobal('fetch', fetchMock);

  await signOut();

  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/api/account/sign-out');
  expect(options.credentials).toBe('include');
});
