import { afterEach, expect, test, vi } from 'vitest';
import {
  createSession,
  deleteSession,
  getAreas,
  getSession,
  getSetup,
  listSessions,
  refreshSession,
  retryFeedback,
  uploadAttempt,
} from '../../src/api/interview.js';

afterEach(() => vi.restoreAllMocks());

function stubFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const ok = (body, status = 200) => ({ ok: true, status, json: async () => body });
const fail = (status, body) => ({ ok: false, status, json: async () => body });

test('getSetup GETs the setup endpoint with credentials', async () => {
  const fetchMock = stubFetch(ok({ question_count: 5 }));
  const out = await getSetup();
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/api/interview/setup');
  expect(options.method).toBe('GET');
  expect(options.credentials).toBe('include');
  expect(out).toEqual({ question_count: 5 });
});

test('listSessions GETs the sessions list', async () => {
  const fetchMock = stubFetch(ok([{ session_id: 's1' }]));
  const out = await listSessions();
  expect(fetchMock.mock.calls[0][0]).toContain('/api/interview/sessions');
  expect(out).toEqual([{ session_id: 's1' }]);
});

test('createSession POSTs role_id and practice_focus', async () => {
  const fetchMock = stubFetch(ok({ session_id: 's1' }, 201));
  await createSession({ roleId: 'R1', focus: 'mixed' });
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/api/interview/sessions');
  expect(options.method).toBe('POST');
  expect(JSON.parse(options.body)).toEqual({ role_id: 'R1', practice_focus: 'mixed' });
});

test('getSession GETs a single session by id', async () => {
  const fetchMock = stubFetch(ok({ session_id: 's1' }));
  await getSession('s1');
  expect(fetchMock.mock.calls[0][0]).toContain('/api/interview/sessions/s1');
  expect(fetchMock.mock.calls[0][1].method).toBe('GET');
});

test('refreshSession POSTs to the refresh path', async () => {
  const fetchMock = stubFetch(ok({ session_id: 's1' }, 201));
  await refreshSession('s1');
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/api/interview/sessions/s1/refresh');
  expect(options.method).toBe('POST');
});

test('deleteSession DELETEs and resolves on 204', async () => {
  const fetchMock = stubFetch({ ok: true, status: 204 });
  await expect(deleteSession('s1')).resolves.toBeUndefined();
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/api/interview/sessions/s1');
  expect(options.method).toBe('DELETE');
});

test('uploadAttempt posts multipart file and returns ok on 200', async () => {
  const attempt = { attempt_no: 1, feedback_status: 'ready' };
  const fetchMock = stubFetch(ok(attempt));
  const audio = new Blob(['x'], { type: 'audio/webm' });
  const result = await uploadAttempt({ sessionId: 's1', sequenceNo: 2, audio });
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/api/interview/sessions/s1/questions/2/attempts');
  expect(options.method).toBe('POST');
  expect(options.body).toBeInstanceOf(FormData);
  expect(options.body.get('file')).toBeInstanceOf(File);
  expect(result).toEqual({ ok: true, attempt });
});

test('uploadAttempt returns ok:false with the saved attempt on 503', async () => {
  const attempt = { attempt_no: 1, feedback_status: 'error', transcript: 'saved' };
  stubFetch(fail(503, { error: 'feedback_service_unavailable', attempt }));
  const audio = new Blob(['x'], { type: 'audio/webm' });
  const result = await uploadAttempt({ sessionId: 's1', sequenceNo: 1, audio });
  expect(result).toEqual({ ok: false, attempt });
});

test('retryFeedback POSTs to the attempt feedback path and returns ok on 200', async () => {
  const attempt = { attempt_no: 2, feedback_status: 'ready' };
  const fetchMock = stubFetch(ok(attempt));
  const result = await retryFeedback(42);
  expect(fetchMock.mock.calls[0][0]).toContain('/api/interview/attempts/42/feedback');
  expect(fetchMock.mock.calls[0][1].method).toBe('POST');
  expect(result).toEqual({ ok: true, attempt });
});

test('retryFeedback returns ok:false with the saved attempt on 503', async () => {
  const attempt = { attempt_no: 2, feedback_status: 'error' };
  stubFetch(fail(503, { error: 'feedback_service_unavailable', attempt }));
  const result = await retryFeedback(42);
  expect(result).toEqual({ ok: false, attempt });
});

test('getAreas GETs the areas endpoint', async () => {
  const fetchMock = stubFetch(ok({ improvements: [], strengths: [] }));
  const out = await getAreas();
  expect(fetchMock.mock.calls[0][0]).toContain('/api/interview/areas');
  expect(out).toEqual({ improvements: [], strengths: [] });
});
