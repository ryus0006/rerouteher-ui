import { afterEach, expect, test, vi } from 'vitest';
import { askCompanion } from '../../src/api/companion.js';
import { buildInterviewContext } from '../../src/lib/interviewContext.js';

afterEach(() => vi.restoreAllMocks());

test('buildInterviewContext maps the current slot and latest recorded attempt', () => {
  const current = {
    questions: [
      {
        question_id: 'GEN-001',
        question_text: 'Tell me about yourself.',
        kind: 'general',
        attempts: [
          { feedback_status: 'pending', transcript: null },
          {
            feedback_status: 'ready',
            transcript: 'I led a small team.',
            feedback_summary: 'Clear and relevant.',
            strengths: [{ title: 'Relevance', detail: 'On topic.' }],
            improvements: [{ title: 'Add a result', detail: 'Say what changed.' }],
          },
        ],
      },
    ],
  };
  expect(buildInterviewContext(current, 0)).toEqual({
    question_id: 'GEN-001',
    question_text: 'Tell me about yourself.',
    kind: 'general',
    transcript: 'I led a small team.',
    feedback_summary: 'Clear and relevant.',
    strengths: [{ title: 'Relevance', detail: 'On topic.' }],
    improvements: [{ title: 'Add a result', detail: 'Say what changed.' }],
  });
});

test('buildInterviewContext returns null without a current session', () => {
  expect(buildInterviewContext(null, 0)).toBeNull();
});

test('buildInterviewContext omits transcript/feedback before any recorded attempt', () => {
  const current = {
    questions: [
      {
        question_id: 'GEN-001',
        question_text: 'Q',
        kind: 'general',
        attempts: [{ feedback_status: 'pending', transcript: null }],
      },
    ],
  };
  const ctx = buildInterviewContext(current, 0);
  expect(ctx.question_id).toBe('GEN-001');
  expect(ctx.transcript).toBeNull();
  expect(ctx.feedback_summary).toBeNull();
  expect(ctx.strengths).toEqual([]);
});

test('askCompanion forwards interview in the body', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ answer: 'hi', sources: [] }) });
  vi.stubGlobal('fetch', fetchMock);
  await askCompanion({
    question: 'help',
    sessionId: 's1',
    journey: {},
    interview: { question_id: 'GEN-001' },
  });
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.interview).toEqual({ question_id: 'GEN-001' });
});
