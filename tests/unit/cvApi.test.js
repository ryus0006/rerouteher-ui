import { afterEach, expect, test, vi } from 'vitest';
import { generateCv, improveCvText } from '../../src/api/cv.js';

afterEach(() => vi.restoreAllMocks());

function stubFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const ok = (body) => ({ ok: true, status: 200, json: async () => body });

test('generateCv sends only role setup and regeneration flag with credentials', async () => {
  const fetchMock = stubFetch(ok({ role_id: 'role-project', generation_status: 'generated' }));

  await generateCv({ roleId: 'role-project', regenerate: true });

  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/api/cv/generate');
  expect(options.method).toBe('POST');
  expect(options.credentials).toBe('include');
  expect(JSON.parse(options.body)).toEqual({
    roleId: 'role-project',
    regenerate: true,
  });
});

test('generateCv can omit an optional role while retaining the default flag', async () => {
  const fetchMock = stubFetch(ok({ role_id: 'role-project', generation_status: 'existing' }));

  await generateCv();

  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ regenerate: false });
});

test('improveCvText sends section text and identifiers, not journey or personal fields', async () => {
  const fetchMock = stubFetch(ok({ suggestion: 'Coordinated delivery.', evidence: 'delivery' }));

  await improveCvText({
    section: 'experience',
    text: '- Coordinated delivery.',
    roleId: 'role-project',
    experienceIndex: 0,
    previous: ['Earlier wording.'],
  });

  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/api/cv/improve');
  expect(options.credentials).toBe('include');
  expect(JSON.parse(options.body)).toEqual({
    section: 'experience',
    roleId: 'role-project',
    experienceIndex: 0,
    currentText: '- Coordinated delivery.',
    previousSuggestions: ['Earlier wording.'],
  });
});
