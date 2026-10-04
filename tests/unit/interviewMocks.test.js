import { beforeEach, describe, expect, it } from 'vitest';
import { resetInterviewMocks } from '../../src/mocks/interview.js';
import {
  createSession,
  getAreas,
  getSession,
  listSessions,
  uploadAttempt,
} from '../../src/api/interview.js';

beforeEach(() => resetInterviewMocks());

describe('interview mocks (full flow against the client)', () => {
  it('creates a session, saves attempts, completes, and aggregates areas', async () => {
    const detail = await createSession({ roleId: 'role_ux', focus: 'mixed' });
    expect(detail.questions).toHaveLength(5);
    expect(detail.status).toBe('active');

    for (const slot of detail.questions) {
      const result = await uploadAttempt({
        sessionId: detail.session_id,
        sequenceNo: slot.sequence_no,
        audio: new Blob(['x'], { type: 'audio/webm' }),
      });
      expect(result.ok).toBe(true);
      expect(result.attempt.feedback_status).toBe('ready');
      expect(result.attempt.response_id).toBeTypeOf('number');
    }

    const after = await getSession(detail.session_id);
    expect(after.status).toBe('completed');
    expect(after.questions.every((q) => q.attempts.length === 1)).toBe(true);

    const list = await listSessions();
    expect(list[0].progress).toBe(5);

    const areas = await getAreas();
    expect(areas.improvements.length).toBeGreaterThan(0);
    expect(areas.improvements[0]).toHaveProperty('title');
    expect(areas.improvements[0]).toHaveProperty('response_count');
  });

  it('creating the same role and focus returns the existing session', async () => {
    const a = await createSession({ roleId: 'role_ux', focus: 'general' });
    const b = await createSession({ roleId: 'role_ux', focus: 'general' });
    expect(b.session_id).toBe(a.session_id);
  });
});
