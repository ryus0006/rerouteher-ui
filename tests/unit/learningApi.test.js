import { afterEach, expect, test, vi } from 'vitest';
import { recommendLearning } from '../../src/api/learning.js';

afterEach(() => vi.restoreAllMocks());

test('recommendLearning posts skill_ids (not names) to the recommend endpoint', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ groups: [], resources: [] }) });
  vi.stubGlobal('fetch', fetchMock);

  await recommendLearning({
    skillIds: ['s1', 's2'],
    targetRoleId: 'R1',
    targetRole: 'UX Designer',
  });

  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/api/learning/recommend');
  const body = JSON.parse(options.body);
  expect(body.skill_ids).toEqual(['s1', 's2']);
  expect(body.target_role_id).toBe('R1');
  expect('skills' in body).toBe(false);
});
